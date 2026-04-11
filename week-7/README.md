# Week7 — Semantic search with LangChain and PGVector

Small example of a **semantic search** pipeline over a PDF: load text, chunk it, embed with OpenAI, store vectors in **PostgreSQL + pgvector**, and query by similarity. The flow follows LangChain’s [knowledge base](https://docs.langchain.com/oss/python/langchain/knowledge-base) tutorial; a natural next step is full **RAG** (retrieve + LLM answer) as in the [RAG](https://docs.langchain.com/oss/python/langchain/rag) guide.

## Tech stack

- **Python** 3.12+ (see [`.python-version`](.python-version) / [`pyproject.toml`](pyproject.toml))
- **LangChain** — `langchain-community`, `langchain-openai`, `langchain-postgres`
- **Embeddings** — OpenAI `text-embedding-3-large`
- **Vector DB** — PostgreSQL with **pgvector** (Docker)
- **Package manager** — [uv](https://github.com/astral-sh/uv)

## Architecture

### Ingestion (indexing)

Indexing is a separate step from querying: load → split → embed → persist.

```mermaid
flowchart LR
  PDF[PDF_file]
  Loader[PyPDFLoader]
  Splitter[RecursiveCharacterTextSplitter]
  Embed[OpenAIEmbeddings]
  Store[PGVector_Postgres]

  PDF --> Loader
  Loader --> Splitter
  Splitter --> Embed
  Embed --> Store
```

### Query (similarity search)

At runtime the user question is embedded and compared to stored vectors.

```mermaid
flowchart LR
  Q[User_query]
  EmbedQ[OpenAIEmbeddings]
  VS[PGVector]
  Out[Similar_chunks]

  Q --> EmbedQ
  EmbedQ --> VS
  VS --> Out
```

### Components in this repo

| Piece | Role |
| --- | --- |
| [`ingestor.py`](ingestor.py) | Loads `docs/codigo-de-trabajo.pdf`, splits into chunks, writes embeddings to PGVector (`collection_name="codigos"`). |
| [`query.py`](query.py) | Prompts for a question, runs `similarity_search`, prints matching `Document` chunks. |
| [`compose.yml`](compose.yml) | Runs `pgvector/pgvector:pg18-trixie` on port `5432` with password `postgres`. |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (Compose v2)
- [uv](https://docs.astral.sh/uv/)
- An **OpenAI API key** for embeddings (`OPENAI_API_KEY`)

## Setup

### 1. Start PostgreSQL with pgvector

From this directory:

```bash
docker compose -f compose.yml up -d
```

Data is stored in the Compose **named volume** `pgdata` so it survives container restarts.

### 2. Python environment and dependencies

```bash
cd week-7
uv venv -p 3.12
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uv sync
```

If you prefer a manual install: `uv add` / `pip install` the packages listed in [`pyproject.toml`](pyproject.toml).

### 3. Environment variables

Create a `.env` in `week-7` (or export in your shell):

```bash
OPENAI_API_KEY=sk-...
```

Both [`ingestor.py`](ingestor.py) and [`query.py`](query.py) call `load_dotenv()` so `OPENAI_API_KEY` can be read from `.env`.

### 4. Database connection

Both scripts use:

`postgresql+psycopg://postgres:postgres@localhost:5432/postgres`

Keep this in sync with [`compose.yml`](compose.yml) if you change credentials or database name.

## Run

1. **Index the PDF** (uncomment `vector_store.add_documents(all_splits)` in [`ingestor.py`](ingestor.py) when you want a full re-ingest; it is commented to avoid duplicate inserts on every run):

   ```bash
   uv run python ingestor.py
   ```

2. **Search interactively**:

   ```bash
   uv run python query.py
   ```

## References

- [Build a semantic search engine with LangChain (knowledge base)](https://docs.langchain.com/oss/python/langchain/knowledge-base)
- [Build a RAG agent with LangChain](https://docs.langchain.com/oss/python/langchain/rag)
