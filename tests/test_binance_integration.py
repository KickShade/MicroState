# tests/test_binance_integration.py
"""
Quick integration test for Binance WebSocket connection.

Run with: python tests/test_binance_integration.py
"""

import asyncio
import sys
from pathlib import Path

from lob_microstructure_analysis.ingestion.binance_client import BinanceWebSocketClient


async def test_connection():
    """Test basic WebSocket connection and data reception."""
    print("="*60)
    print("BINANCE WEBSOCKET CONNECTION TEST")
    print("="*60)
    print("Symbol: BTCUSDT")
    print("Testing connection and first 10 messages...")
    print("="*60 + "\n")
    
    client = BinanceWebSocketClient(symbol="btcusdt", update_speed="100ms")
    
    try:
        message_count = 0
        total_updates = 0
        
        async for updates in client.stream_updates():
            message_count += 1
            total_updates += len(updates)
            
            print(f"\n📨 Message #{message_count}")
            print(f"   Updates in message: {len(updates)}")
            print(f"   Total updates so far: {total_updates}")
            
            # Show sample of updates
            if updates:
                first_bid = next((u for u in updates if u.side == 'bid'), None)
                first_ask = next((u for u in updates if u.side == 'ask'), None)
                
                if first_bid:
                    print(f"   Sample BID: ${first_bid.price:,.2f} x {first_bid.quantity:.5f}")
                if first_ask:
                    print(f"   Sample ASK: ${first_ask.price:,.2f} x {first_ask.quantity:.5f}")
                
                print(f"   Timestamp: {updates[0].timestamp} ms")
                print(f"   Update ID: {updates[0].update_id}")
            
            # Stop after 10 messages
            if message_count >= 10:
                print("\n✅ Test successful! Connection working.")
                break
    
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise
    
    finally:
        await client.close()
        print("\n" + "="*60)
        print(f"TEST COMPLETE")
        print(f"Messages received: {message_count}")
        print(f"Total updates: {total_updates}")
        print("="*60 + "\n")


async def test_data_quality():
    """Test data quality and structure."""
    print("="*60)
    print("DATA QUALITY TEST")
    print("="*60)
    print("Checking for:")
    print("  • Valid timestamps")
    print("  • Positive prices")
    print("  • Non-negative quantities")
    print("  • Correct side labels")
    print("="*60 + "\n")
    
    client = BinanceWebSocketClient(symbol="btcusdt", update_speed="100ms")
    
    try:
        issues = []
        checks = 0
        
        async for updates in client.stream_updates():
            for update in updates:
                checks += 1
                
                # Validation checks
                if update.timestamp <= 0:
                    issues.append(f"Invalid timestamp: {update.timestamp}")
                
                if update.price <= 0:
                    issues.append(f"Invalid price: {update.price}")
                
                if update.quantity < 0:
                    issues.append(f"Negative quantity: {update.quantity}")
                
                if update.side not in ['bid', 'ask']:
                    issues.append(f"Invalid side: {update.side}")
            
            # Stop after 100 updates
            if checks >= 100:
                break
        
        print(f"✅ Validated {checks} updates")
        
        if issues:
            print(f"\n⚠️  Found {len(issues)} issues:")
            for issue in issues[:10]:  # Show first 10
                print(f"   • {issue}")
        else:
            print("✅ All data quality checks passed!")
    
    finally:
        await client.close()


async def test_throughput():
    """Measure message throughput."""
    import time
    
    print("="*60)
    print("THROUGHPUT TEST")
    print("="*60)
    print("Measuring updates per second for 30 seconds...")
    print("="*60 + "\n")
    
    client = BinanceWebSocketClient(symbol="btcusdt", update_speed="100ms")
    
    try:
        start_time = time.time()
        update_count = 0
        message_count = 0
        
        async for updates in client.stream_updates():
            message_count += 1
            update_count += len(updates)
            
            elapsed = time.time() - start_time
            
            if elapsed >= 30:
                break
        
        elapsed = time.time() - start_time
        updates_per_sec = update_count / elapsed
        messages_per_sec = message_count / elapsed
        
        print(f"\n📊 RESULTS:")
        print(f"   Duration:        {elapsed:.1f} seconds")
        print(f"   Total messages:  {message_count:,}")
        print(f"   Total updates:   {update_count:,}")
        print(f"   Messages/sec:    {messages_per_sec:.1f}")
        print(f"   Updates/sec:     {updates_per_sec:.1f}")
        
        # Expected: ~10 messages/sec (100ms updates) with variable updates per message
        if 8 <= messages_per_sec <= 12:
            print("\n✅ Throughput is within expected range (8-12 msg/sec)")
        else:
            print(f"\n⚠️  Throughput outside expected range: {messages_per_sec:.1f} msg/sec")
    
    finally:
        await client.close()


async def main():
    """Run all tests."""
    tests = [
        ("Connection Test", test_connection),
        ("Data Quality Test", test_data_quality),
        ("Throughput Test", test_throughput),
    ]
    
    for name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {name}")
        print(f"{'='*60}\n")
        
        try:
            await test_func()
            print(f"✅ {name} passed\n")
        except Exception as e:
            print(f"❌ {name} failed: {e}\n")
            break
        
        # Wait between tests
        if test_func != tests[-1][1]:
            print("Waiting 3 seconds before next test...\n")
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())