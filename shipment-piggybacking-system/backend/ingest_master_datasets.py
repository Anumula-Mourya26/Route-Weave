import os
import json
import csv

data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)
print("Ingestion script ready in", data_dir)
