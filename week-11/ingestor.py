import sys

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()


def ingest(file_path: str) -> int:
    """Load a PDF, split it into chunks, embed, and store in PGVector.

    Returns the number of chunks stored.
    """
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200, add_start_index=True
    )
    all_splits = text_splitter.split_documents(docs)

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name="codigos_de_guatemala",
        connection="postgresql+psycopg://postgres:postgres@localhost:5432/agentdb",
    )

    vector_store.add_documents(documents=all_splits)
    return len(all_splits)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingestor.py <path-to-pdf>")
        sys.exit(1)

    path = sys.argv[1]
    n = ingest(path)
    print(f"Ingested {n} chunks from {path}")