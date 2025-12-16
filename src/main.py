import asyncio

from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.ingestion.loader import LOBDataLoader
from lob_microstructure_analysis.ingestion.processor import OrderBookProcessor

DATA_PATH = "data/processed/BTCUSDT_2025-08-11.csv"


async def main() -> None:
    queue = asyncio.Queue()

    orderbook = OrderBook(max_depth=20)
    processor = OrderBookProcessor(orderbook)
    loader = LOBDataLoader(DATA_PATH, replay_speed=0)

    async def producer():
        async for update in loader.stream():   # 🔴 MUST be async for
            await queue.put(update)
        await queue.put(None)

    producer_task = asyncio.create_task(producer())
    consumer_task = asyncio.create_task(processor.run(queue))

    await producer_task
    await queue.join()
    await consumer_task


if __name__ == "__main__":
    asyncio.run(main())
