import sys
import os

# Include current directory in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Loading FastAPI main application...")
    from app.main import app
    print("\nSUCCESS: Application imported successfully!")
    print("\nRegistered Endpoints:")
    for route in app.routes:
        methods = getattr(route, 'methods', None)
        methods_str = f" [{', '.join(methods)}]" if methods else ""
        print(f"  {route.path:<30}{methods_str}")
    sys.exit(0)
except Exception as e:
    import traceback
    print("\nFATAL ERROR during startup import:")
    traceback.print_exc()
    sys.exit(1)
