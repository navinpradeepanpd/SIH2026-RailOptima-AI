import os

# Disable safety buffer in tests by default to match old deterministic test behavior
os.environ["SAFETY_BUFFER_MINUTES"] = "0"

# Also overwrite module level constants if they were already imported
import conflict_detection.engine
import optimization.engine
conflict_detection.engine.SAFETY_BUFFER_MINUTES = 0
optimization.engine.SAFETY_BUFFER_MINUTES = 0
