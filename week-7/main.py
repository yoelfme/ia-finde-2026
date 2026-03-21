from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings

file_path = "./docs/codigo-de-trabajo.pdf"

# cargar el PDF, y por cada pagina se crea un objet Document
loader = PyPDFLoader(file_path)

# cargar los documentos
docs = loader.load() # [Document, Document, Document, ...]

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200, add_start_index=True
)
all_splits = text_splitter.split_documents(docs)
print(len(all_splits))

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="codigo_de_trabajo",
    connection="postgresql+psycopg://postgres:mysecretpassword@localhost:5432/postgres",
)

# vector_store.add_documents(all_splits)
results = vector_store.similarity_search(
    "Cual es el maximo de horas de trabajo por dia?"
)

print(results)

