

### Phase 1: Combinatorial Synthetic Data Generation
Your initial dataset of 2,000 files is too small and contains slicer-specific artifacts. You must multiply this into 100,000+ files using stacked mathematical variations.

1.  **STL Geometry Manipulation:** Write a Python script using `trimesh` to load your base STLs and apply random anisotropic scaling (stretching the object by 1% to 3% exclusively on the X, Y, or Z axis).
2.  **Headless Slicer Randomization:** Feed the modified STLs into a headless slicer via CLI (e.g., PrusaSlicer). For every generation loop, randomly select all variables simultaneously:
    * Layer Height: 0.12mm to 0.28mm.
    * Infill Density: 15% to 100%.
    * Infill Pattern: Gyroid, Grid, Cubic.
    * Perimeter Counts: 2 to 6.
3.  **Output:** This yields thousands of mathematically unique toolpaths for a single object, destroying any Z-axis step frequency or sequence length shortcuts.

### Phase 2: G-Code Parsing and Filtering
Extract the raw numerical paths from the generated G-code files while preserving the mathematical state.

1.  **Read State Modifiers:** Program your parser to read and update its internal variables based on `G90` / `G91` (Absolute vs. Relative coordinates), `M82` / `M83` (Absolute vs. Relative extrusion), and `G92` (Set Position/Reset Extruder). 
2.  **Extract Geometric Toolpaths:** Extract the coordinates and extrusion values exclusively from **`G0`**, **`G1`**, **`G2`**, and **`G3`** commands. Retaining `G0` is critical so the model understands travel moves across empty space.
3.  **Purge the Noise:** Completely delete headers, comments, temperatures, fan speeds, and machine limits (e.g., `M201`, `M203`).

### Phase 3: Spatial Feature Engineering
Do not feed raw absolute coordinates or string tokens to the CNN. Translate the raw data into translation and rotation-invariant features.

1.  **Calculate Relative Change:** Ensure all movements are tracked as $\Delta X, \Delta Y, \Delta Z, \Delta E$.
2.  **Calculate Trajectory Angle:** Use the dot product to find the angle $\theta$ between consecutive movement vectors to expose sharp corners and curves.
3.  **Calculate Segment Length:** Determine the 2D movement magnitude ($L = \sqrt{\Delta X^2 + \Delta Y^2}$).
4.  **Calculate Normalized Extrusion:** Calculate the extrusion rate per unit of distance to standardize material flow across varying layer heights.
5.  **Build the Tensor:** Construct an $N \times 4$ numerical array for each file, where every row represents one step: `[Segment Length, Trajectory Angle, Extrusion Rate, Delta Z]`. Apply a random 2D rotation matrix to the trajectory vectors dynamically to simulate different build-plate orientations.

### Phase 4: Tensor Preparation and Dataset Construction
Format the engineered features to pass into the neural network without causing gradient explosion or padding bias.

1.  **Normalization:** Apply a MinMax Scaler or Standard Scaler to the tensors so all numerical values fall between -1 and 1. This prevents massive initial activations that permanently saturate your final classification layer.
2.  **Stratified Splitting:** Use your text metadata columns (`subcategory`, `part`) to execute a Stratified k-Fold split. This ensures an even distribution of receiver types and brace types across your Train and Test sets.
3.  **Prevent Target Leakage:** Strip all text strings (filenames, subcategories, metadata) out of the dataset. The target variable $y$ must strictly be the binary integer (1 or 0).

### Phase 5: Deep Convolutional Training
Redesign your PyTorch model architecture and loading logic to handle spatial sequences.

1.  **Replace NLP Layers:** Remove `nn.Embedding` and Global Max Pooling. The input is a continuous float tensor, not a categorical token.
2.  **Hierarchical Architecture:** Build a deep 1D CNN using stacked `Conv1d` layers followed by local `MaxPool1d` (kernel size 2) layers. This allows the network to learn small curves early on and compress them into macro-shapes (like a trigger guard) in the deeper layers. Cap the convolutional stack with `AdaptiveAvgPool1d` to flatten the output for the linear classification head.
3.  **Random Cropping (Training):** Do not zero-pad files to a maximum length. Inside your PyTorch `__getitem__` function, randomly select a starting index and slice out a contiguous, fixed-length chunk (e.g., 4,096 lines) from the G-code tensor. Feed this chunk to the CNN.

### Phase 6: Inference Pipeline
Deploy a specific strategy to handle varying-length, unlabeled files during testing or production.

1.  **The Sliding Window:** When evaluating a full, unseen G-code file, slice it sequentially into overlapping chunks of your trained size (4,096 lines).
2.  **Majority Vote / Max Pooling:** Pass every chunk through the trained CNN. If any single chunk (or a designated threshold of chunks) returns a highly confident "gun part" probability, classify the entire file as a positive match.