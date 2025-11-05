"""
Q-Q Plot Implementation

This module provides functionality to create Quantile-Quantile (Q-Q) plots
for comparing a sample distribution against a theoretical distribution.
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy import stats


def qq_plot(data, distribution='norm', dist_params=None, ax=None,
            show_line=True, alpha=0.5, title='Q-Q Plot'):
    """
    Create a Quantile-Quantile (Q-Q) plot.

    Parameters:
    -----------
    data : array-like
        Sample data to be plotted
    distribution : str, optional
        Theoretical distribution to compare against. Default is 'norm' (normal).
        Can be any scipy.stats distribution name (e.g., 'norm', 't', 'uniform', 'expon')
    dist_params : tuple, optional
        Parameters for the theoretical distribution. If None, uses standard parameters.
    ax : matplotlib.axes.Axes, optional
        Axes object to plot on. If None, creates a new figure.
    show_line : bool, optional
        Whether to show the 45-degree reference line. Default is True.
    alpha : float, optional
        Transparency of the data points. Default is 0.5.
    title : str, optional
        Title for the plot. Default is 'Q-Q Plot'.

    Returns:
    --------
    fig, ax : matplotlib figure and axes objects

    Example:
    --------
    >>> data = np.random.normal(0, 1, 1000)
    >>> qq_plot(data, distribution='norm')
    """
    # Sort the data
    data = np.asarray(data)
    sorted_data = np.sort(data)
    n = len(sorted_data)

    # Calculate theoretical quantiles
    # Use (i - 0.5) / n as plotting positions
    probabilities = (np.arange(1, n + 1) - 0.5) / n

    # Get the theoretical distribution
    if distribution == 'norm':
        dist = stats.norm
        if dist_params is None:
            dist_params = (0, 1)  # mean=0, std=1
    elif distribution == 't':
        dist = stats.t
        if dist_params is None:
            dist_params = (5,)  # df=5
    elif distribution == 'uniform':
        dist = stats.uniform
        if dist_params is None:
            dist_params = (0, 1)  # loc=0, scale=1
    elif distribution == 'expon':
        dist = stats.expon
        if dist_params is None:
            dist_params = (1,)  # scale=1
    else:
        dist = getattr(stats, distribution)
        if dist_params is None:
            dist_params = ()

    # Calculate theoretical quantiles
    theoretical_quantiles = dist.ppf(probabilities, *dist_params)

    # Create plot
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))
    else:
        fig = ax.get_figure()

    # Plot the Q-Q plot
    ax.scatter(theoretical_quantiles, sorted_data, alpha=alpha,
               edgecolors='black', linewidth=0.5)

    # Add reference line (y = x)
    if show_line:
        min_val = min(theoretical_quantiles.min(), sorted_data.min())
        max_val = max(theoretical_quantiles.max(), sorted_data.max())
        ax.plot([min_val, max_val], [min_val, max_val],
                'r--', linewidth=2, label='y = x')
        ax.legend()

    # Labels and title
    ax.set_xlabel(f'Theoretical Quantiles ({distribution})', fontsize=12)
    ax.set_ylabel('Sample Quantiles', fontsize=12)
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)

    return fig, ax


def qq_plot_with_fit(data, ax=None, alpha=0.5, title='Q-Q Plot (Fitted)'):
    """
    Create a Q-Q plot comparing sample data against a normal distribution
    fitted to the data (using sample mean and standard deviation).

    Parameters:
    -----------
    data : array-like
        Sample data to be plotted
    ax : matplotlib.axes.Axes, optional
        Axes object to plot on. If None, creates a new figure.
    alpha : float, optional
        Transparency of the data points. Default is 0.5.
    title : str, optional
        Title for the plot. Default is 'Q-Q Plot (Fitted)'.

    Returns:
    --------
    fig, ax : matplotlib figure and axes objects
    """
    data = np.asarray(data)

    # Fit normal distribution to data
    mu, sigma = np.mean(data), np.std(data, ddof=1)

    # Sort the data
    sorted_data = np.sort(data)
    n = len(sorted_data)

    # Calculate theoretical quantiles using fitted parameters
    probabilities = (np.arange(1, n + 1) - 0.5) / n
    theoretical_quantiles = stats.norm.ppf(probabilities, mu, sigma)

    # Create plot
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))
    else:
        fig = ax.get_figure()

    # Plot the Q-Q plot
    ax.scatter(theoretical_quantiles, sorted_data, alpha=alpha,
               edgecolors='black', linewidth=0.5)

    # Add reference line
    min_val = min(theoretical_quantiles.min(), sorted_data.min())
    max_val = max(theoretical_quantiles.max(), sorted_data.max())
    ax.plot([min_val, max_val], [min_val, max_val],
            'r--', linewidth=2, label='y = x')

    # Labels and title
    ax.set_xlabel(f'Theoretical Quantiles N({mu:.2f}, {sigma:.2f}²)', fontsize=12)
    ax.set_ylabel('Sample Quantiles', fontsize=12)
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    ax.legend()

    return fig, ax


if __name__ == '__main__':
    """
    Example usage demonstrating different Q-Q plots
    """
    # Set random seed for reproducibility
    np.random.seed(42)

    # Create sample datasets
    normal_data = np.random.normal(0, 1, 1000)
    skewed_data = np.random.exponential(2, 1000)
    heavy_tailed_data = np.random.standard_t(3, 1000)
    uniform_data = np.random.uniform(-3, 3, 1000)

    # Create a figure with multiple Q-Q plots
    fig, axes = plt.subplots(2, 2, figsize=(14, 12))

    # 1. Normal data vs normal distribution (should be close to line)
    qq_plot(normal_data, distribution='norm', ax=axes[0, 0],
            title='Normal Data vs Normal Distribution')

    # 2. Skewed data vs normal distribution (will deviate from line)
    qq_plot(skewed_data, distribution='norm', ax=axes[0, 1],
            title='Exponential Data vs Normal Distribution')

    # 3. Heavy-tailed data vs normal distribution
    qq_plot(heavy_tailed_data, distribution='norm', ax=axes[1, 0],
            title='Heavy-Tailed Data vs Normal Distribution')

    # 4. Uniform data vs uniform distribution
    qq_plot(uniform_data, distribution='uniform', dist_params=(-3, 6),
            ax=axes[1, 1], title='Uniform Data vs Uniform Distribution')

    plt.tight_layout()
    plt.savefig('qq_plots_examples.png', dpi=300, bbox_inches='tight')
    print("Q-Q plots saved to 'qq_plots_examples.png'")

    # Create a single Q-Q plot with fitted distribution
    fig2, ax2 = plt.subplots(figsize=(8, 8))
    qq_plot_with_fit(normal_data, ax=ax2,
                     title='Normal Data vs Fitted Normal Distribution')
    plt.savefig('qq_plot_fitted.png', dpi=300, bbox_inches='tight')
    print("Fitted Q-Q plot saved to 'qq_plot_fitted.png'")

    plt.show()
