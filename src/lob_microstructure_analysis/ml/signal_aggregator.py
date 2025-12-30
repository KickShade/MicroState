from typing import Dict


def aggregate_signals(
    micro_signal: str,
    price_trend: str,
    micro_confidence: float | None = None
) -> Dict[str, str]:
    """
    Combine short-term microstructure signal with mid-term price trend.

    Parameters
    ----------
    micro_signal : str
        'UP' or 'DOWN' from microstructure model
    price_trend : str
        'BULLISH' or 'BEARISH' from Prophet
    micro_confidence : float, optional
        Confidence of microstructure prediction

    Returns
    -------
    Dict[str, str]
        Interpreted combined signal
    """

    # Normalize inputs
    micro_signal = micro_signal.upper()
    price_trend = price_trend.upper()

    if micro_signal == "UP" and price_trend == "BULLISH":
        label = "STRONG_BULLISH"
        meaning = "Short-term pressure aligns with upward trend"

    elif micro_signal == "UP" and price_trend == "BEARISH":
        label = "COUNTER_TREND_LONG"
        meaning = "Short-term buying against downward trend (risky)"

    elif micro_signal == "DOWN" and price_trend == "BULLISH":
        label = "PULLBACK_WAIT"
        meaning = "Selling pressure within a broader uptrend"

    elif micro_signal == "DOWN" and price_trend == "BEARISH":
        label = "STRONG_BEARISH"
        meaning = "Short-term pressure aligns with downward trend"

    else:
        label = "NEUTRAL"
        meaning = "No clear alignment between signals"

    return {
        "combined_signal": label,
        "interpretation": meaning,
        "micro_signal": micro_signal,
        "price_trend": price_trend,
        "micro_confidence": micro_confidence
    }

if __name__ == "__main__":
    print(aggregate_signals("UP", "BULLISH", 0.68))
    print(aggregate_signals("UP", "BEARISH", 0.68))
    print(aggregate_signals("DOWN", "BULLISH", 0.55))
    print(aggregate_signals("DOWN", "BEARISH", 0.72))
