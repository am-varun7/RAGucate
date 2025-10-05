# backend.py — FastAPI backend for PDF RAG + Gemini Agent
# Supports multiple PDFs, .env API key, and PDF deletion

import os
import shutil
import json
import numpy as np
import faiss
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

# ---- Load .env ----
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("⚠️ GOOGLE_API_KEY not found in .env!")

genai.configure(api_key=API_KEY)

# ---- Config ----
UPLOAD_FOLDER = "uploaded_pdfs"
INDEX_FOLDER = "my_index"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 200
EMBEDDING_DIM = 384
TOP_K = 5
THRESHOLD = 0.60
GEMINI_MODEL = "gemini-2.5-flash"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)

# ---- FastAPI setup ----
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow your frontend origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- PDF utilities ----
def extract_text_from_pdf(path: str) -> str:
    texts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                texts.append(text)
    return "\n\n".join(texts)

def chunk_text(text: str, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    text = text.replace("\r", " ")
    chunks = []
    start = 0
    N = len(text)
    while start < N:
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap
        if start < 0:
            start = 0
        if start >= N:
            break
    return chunks

# ---- FAISS Index utilities ----
def build_index(chunks):
    embed_model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = embed_model.encode(chunks, show_progress_bar=True, batch_size=64, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(embeddings)
    return index, embeddings

def save_index(index, metadata, embeddings):
    os.makedirs(INDEX_FOLDER, exist_ok=True)
    faiss.write_index(index, os.path.join(INDEX_FOLDER, "index.faiss"))
    with open(os.path.join(INDEX_FOLDER, "metadata.jsonl"), "w", encoding="utf8") as f:
        for m in metadata:
            f.write(json.dumps(m, ensure_ascii=False) + "\n")
    np.save(os.path.join(INDEX_FOLDER, "embeddings.npy"), embeddings)

def load_index():
    index_path = os.path.join(INDEX_FOLDER, "index.faiss")
    if not os.path.exists(index_path):
        index = faiss.IndexFlatIP(EMBEDDING_DIM)
        return index, [], np.zeros((0, EMBEDDING_DIM), dtype="float32")
    index = faiss.read_index(index_path)
    metadata = []
    with open(os.path.join(INDEX_FOLDER, "metadata.jsonl"), "r", encoding="utf8") as f:
        for line in f:
            metadata.append(json.loads(line))
    embeddings = np.load(os.path.join(INDEX_FOLDER, "embeddings.npy"))
    return index, metadata, embeddings

def append_to_index(new_chunks, pdf_name):
    index, metadata, embeddings = load_index()
    new_index, new_embeddings = build_index(new_chunks)
    index.add(new_embeddings)
    start_id = len(metadata)
    for i, chunk in enumerate(new_chunks):
        metadata.append({"chunk_id": start_id + i, "text": chunk, "pdf": pdf_name})
    all_embeddings = np.vstack([embeddings, new_embeddings]) if embeddings.size else new_embeddings
    save_index(index, metadata, all_embeddings)

def remove_pdf_from_index(pdf_name):
    index, metadata, embeddings = load_index()
    keep = [i for i, m in enumerate(metadata) if m.get("pdf") != pdf_name]
    if not keep:
        # reset index
        index = faiss.IndexFlatIP(EMBEDDING_DIM)
        save_index(index, [], np.zeros((0, EMBEDDING_DIM), dtype="float32"))
        return
    # filter embeddings and metadata
    new_embeddings = embeddings[keep]
    new_metadata = [metadata[i] for i in keep]
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(new_embeddings)
    save_index(index, new_metadata, new_embeddings)

# ---- Search ----
def search_index(query, index, metadata, top_k=TOP_K):
    if index.ntotal == 0:
        return []
    embed_model = SentenceTransformer(EMBEDDING_MODEL)
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    D, I = index.search(q_emb, top_k)
    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < 0:
            continue
        results.append({"score": float(dist), "text": metadata[idx]["text"], "pdf": metadata[idx].get("pdf")})
    return results

# ---- Gemini answer ----
def answer_with_gemini(question: str, context: str = None):
    model = genai.GenerativeModel(GEMINI_MODEL)
    if context:
        prompt = f"You are a helpful AI assistant. Answer using ONLY the context below.\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    else:
        prompt = f"You are a helpful AI assistant. Answer the question as best as possible.\n\nQuestion: {question}\n\nAnswer:"
    response = model.generate_content(prompt)
    return response.text

# ---- API Models ----
class Question(BaseModel):
    question: str

# ---- Routes ----
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # Extract and index
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    append_to_index(chunks, file.filename)
    return {"status": "success", "filename": file.filename}

@app.post("/ask")
async def ask_question(q: Question):
    index, metadata, _ = load_index()
    results = search_index(q.question, index, metadata)
    if results and results[0]["score"] >= THRESHOLD:
        context = "\n\n".join([r["text"] for r in results])
        answer = answer_with_gemini(q.question, context)
        sources = list({r.get("pdf") for r in results})
    else:
        context = None
        answer = answer_with_gemini(q.question)
        sources = ["gemini"]
    return {"answer": answer, "sources": sources}

@app.get("/files")
async def list_files():
    files = []
    for f in os.listdir(UPLOAD_FOLDER):
        if f.lower().endswith((".pdf", ".txt")):
            info = os.stat(os.path.join(UPLOAD_FOLDER, f))
            files.append({"title": f, "date": str(info.st_mtime), "subject": ""})
    return {"files": files}

@app.delete("/delete/{pdf_name}")
async def delete_pdf(pdf_name: str):
    file_path = os.path.join(UPLOAD_FOLDER, pdf_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file_path)
    remove_pdf_from_index(pdf_name)
    return {"status": "success", "message": f"{pdf_name} deleted successfully."}

# ---- Run server directly ----
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)  # reload=False avoids warnings
