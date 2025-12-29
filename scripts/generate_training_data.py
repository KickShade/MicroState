import asyncio
from pathlib import Path

from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.core.processor import OrderBookProcessor
from lob_microstructure_analysis.ingestion.loader import LOBDataLoader


async def main():
    data_path = Path(
        r"C:\Users\Arjun Haridas\Desktop\Genesis\lob-microstructure-analysis\data\processed\BTCUSDT_2025-08-11.csv"
    )

    orderbook = OrderBook(max_depth=50)
    processor = OrderBookProcessor(orderbook=orderbook)

    queue = asyncio.Queue()

    # Start processor consumer
    processor_task = asyncio.create_task(processor.run(queue))

    loader = LOBDataLoader(data_path)

    print("▶ Processing dataset...")

    # Feed updates into queue
    async for update in loader.stream():
        await queue.put(update)

    # Signal end of stream
    await queue.put(None)

    # Wait for processor to finish
    await processor_task

    # Save dataset
    output_path = Path("data/features/training_1s.parquet")
    processor.feature_store.save(output_path)

    # Print stats
    stats = processor.feature_store.get_stats()
    print("\n Dataset stats:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # --- Resolve labels after full stream ---
    for record in processor.feature_store._records:
        if record["label"] is None:
            ts = record["timestamp"]
            mid = record["mid_price"]
            record["label"] = processor.label_generator.get_label(ts, mid)
    
if __name__ == "__main__":
    asyncio.run(main())
