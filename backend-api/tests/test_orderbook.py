from lob_microstructure_analysis.core.orderbook import OrderBook



def test_basic_insert():
    ob = OrderBook()
    ob.update_level("bid", 100.0, 5.0)
    ob.update_level("ask", 101.0, 3.0)

    assert ob.best_bid() == 100.0
    assert ob.best_ask() == 101.0


def test_mid_price_and_spread():
    ob = OrderBook()
    ob.update_level("bid", 100.0, 1.0)
    ob.update_level("ask", 102.0, 1.0)

    assert ob.mid_price() == 101.0
    assert ob.spread() == 2.0


def test_cancel_level():
    ob = OrderBook()
    ob.update_level("bid", 100.0, 5.0)
    ob.update_level("bid", 100.0, 0.0)

    assert ob.best_bid() is None


def test_depth_limit():
    ob = OrderBook(max_depth=2)
    ob.update_level("bid", 101, 1)
    ob.update_level("bid", 100, 1)
    ob.update_level("bid", 99, 1)

    assert len(ob.bids) == 2


def test_crossed_book_cleanup():
    ob = OrderBook()
    ob.update_level("bid", 101, 1)
    ob.update_level("ask", 100, 1)

    assert ob.best_ask() is None
