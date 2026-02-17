.PHONY: backend frontend seed dev

# Start backend (FastAPI)
backend:
	cd backend && uvicorn backend.main:app --reload --port 8000

# Start frontend (Next.js)
frontend:
	cd frontend && npx next dev --port 3000

# Seed demo data
seed:
	python scripts/seed_demo.py

# Start both (run in separate terminals)
dev:
	@echo "Run these in separate terminals:"
	@echo "  make backend"
	@echo "  make frontend"
	@echo ""
	@echo "Then seed demo data:"
	@echo "  make seed"
