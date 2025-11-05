# Q-Q Plot Implementation

A Python implementation of Quantile-Quantile (Q-Q) plots for statistical analysis and distribution comparison.

## What is a Q-Q Plot?

A Q-Q (Quantile-Quantile) plot is a graphical tool used to assess whether a dataset follows a particular theoretical distribution. It plots the quantiles of the sample data against the quantiles of the theoretical distribution. If the data follows the theoretical distribution, the points should fall approximately along the 45-degree reference line (y = x).

## Features

- **Flexible distribution comparison**: Compare against normal, t, uniform, exponential, or any scipy.stats distribution
- **Fitted Q-Q plots**: Automatically fit distribution parameters to your data
- **Customizable plots**: Control appearance with various parameters
- **Multiple examples**: Demonstrates various use cases and interpretations

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Q-Q Plot

```python
import numpy as np
from qq_plot import qq_plot

# Generate sample data
data = np.random.normal(0, 1, 1000)

# Create Q-Q plot against standard normal distribution
qq_plot(data, distribution='norm')
```

### Q-Q Plot with Fitted Distribution

```python
from qq_plot import qq_plot_with_fit

# Create Q-Q plot with distribution fitted to the data
qq_plot_with_fit(data)
```

### Compare Against Different Distributions

```python
# Compare against t-distribution with 5 degrees of freedom
qq_plot(data, distribution='t', dist_params=(5,))

# Compare against exponential distribution
qq_plot(data, distribution='expon', dist_params=(1,))

# Compare against uniform distribution
qq_plot(data, distribution='uniform', dist_params=(0, 1))
```

### Customization Options

```python
qq_plot(data,
        distribution='norm',
        show_line=True,      # Show reference line
        alpha=0.7,           # Point transparency
        title='My Q-Q Plot') # Custom title
```

## Running the Examples

Run the main script to generate example Q-Q plots:

```bash
python qq_plot.py
```

This will create two image files:
- `qq_plots_examples.png`: Four different Q-Q plots comparing various distributions
- `qq_plot_fitted.png`: A Q-Q plot with fitted normal distribution

## Interpreting Q-Q Plots

- **Points on the line**: Data follows the theoretical distribution
- **Points curve above the line**: Data has heavier tails (more extreme values) than theoretical distribution
- **Points curve below the line**: Data has lighter tails than theoretical distribution
- **S-shaped curve**: Data is skewed relative to theoretical distribution
- **Systematic deviations**: Data does not follow the theoretical distribution

## Function Reference

### `qq_plot(data, distribution='norm', dist_params=None, ax=None, show_line=True, alpha=0.5, title='Q-Q Plot')`

Create a Q-Q plot comparing sample data against a theoretical distribution.

**Parameters:**
- `data`: Sample data (array-like)
- `distribution`: Theoretical distribution name (default: 'norm')
- `dist_params`: Distribution parameters (optional)
- `ax`: Matplotlib axes object (optional)
- `show_line`: Show 45-degree reference line (default: True)
- `alpha`: Point transparency (default: 0.5)
- `title`: Plot title (default: 'Q-Q Plot')

**Returns:**
- `fig, ax`: Matplotlib figure and axes objects

### `qq_plot_with_fit(data, ax=None, alpha=0.5, title='Q-Q Plot (Fitted)')`

Create a Q-Q plot with distribution parameters fitted to the data.

**Parameters:**
- `data`: Sample data (array-like)
- `ax`: Matplotlib axes object (optional)
- `alpha`: Point transparency (default: 0.5)
- `title`: Plot title (default: 'Q-Q Plot (Fitted)')

**Returns:**
- `fig, ax`: Matplotlib figure and axes objects

## Dependencies

- numpy
- matplotlib
- scipy

## License

MIT
