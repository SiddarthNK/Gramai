import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from config import get_settings

settings = get_settings()

def get_embeddings():
    if settings.google_api_key:
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.google_api_key)
    elif settings.openai_api_key:
        return OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
    return None

class RAGMemory:
    def __init__(self, collection_name="gramai_knowledge"):
        self.persist_directory = settings.chroma_persist_dir
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.embeddings = get_embeddings()
        if self.embeddings:
            self.vectorstore = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
        else:
            self.vectorstore = None

    def add_documents(self, texts, metadatas=None):
        if not self.vectorstore:
            return False
        self.vectorstore.add_texts(texts, metadatas=metadatas)
        return True

    def search(self, query, k=3):
        if not self.vectorstore:
            return []
        return self.vectorstore.similarity_search(query, k=k)

_memory = None

def get_memory():
    global _memory
    if _memory is None:
        _memory = RAGMemory()
    return _memory
