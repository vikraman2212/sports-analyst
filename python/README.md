# Speedometer ML Python Package

Utilities for speed calculation and ML model training.

## Python Speed Calculation Utilities

## Project Structure

```
python/
  speedometer/          # Source package
    __init__.py
    speed_calc.py       # Speed calculation utilities
  tests/                # Python tests
    test_speed_calc.py
  .venv/                # Virtual environment (gitignored)
  pyproject.toml        # At project root
```

## Setup

Create a virtual environment and install dependencies:

```bash
cd python
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
cd ..
pip install -e .
```

## Usage

The `speedometer` package provides utilities for processing ball detection coordinates and computing speed in km/h.

```python
from speedometer import speed_calc

# Example usage (to be implemented)
# speed = speed_calc.calculate_speed(detections, calibration)
```

## Testing

Run tests with pytest from the project root:

```bash
pytest python/tests/
```

Or with coverage:

```bash
pytest python/tests/ --cov=speedometer --cov-report=term-missing
```

## Running Tests

```bash
pytest
```

## Structure

- `python/` - Core speed calculation logic
- `ml/training/` - Model training scripts
- `ml/notebooks/` - Jupyter notebooks for experimentation
- `tests/` - Python unit tests
