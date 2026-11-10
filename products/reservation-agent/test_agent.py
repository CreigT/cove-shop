import tempfile
import unittest
from datetime import datetime,timedelta
from pathlib import Path
from agent import connect,seed,book,decide

class ReservationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.db=connect(Path(self.temp.name)/"test.db")
        seed(self.db)
        self.when=(datetime.now()+timedelta(days=2)).replace(hour=19,minute=0,second=0,microsecond=0).isoformat(timespec="minutes")
    def tearDown(self):
        self.db.close()
        self.temp.cleanup()
    def test_booking_and_capacity(self):
        self.assertEqual(book(self.db,"Guest",8,self.when)["status"],"confirmed")
        self.assertEqual(book(self.db,"Guest 2",8,self.when)["status"],"unavailable")
    def test_bad_input(self):
        with self.assertRaises(ValueError):book(self.db,"",2,self.when)
        with self.assertRaises(ValueError):book(self.db,"Guest",9,self.when)
    def test_interruption_and_handoff(self):
        self.assertEqual(decide({"action":"interrupt"})["status"],"interrupted")
        self.assertEqual(decide({"action":"handoff"})["status"],"handoff_requested")

if __name__=="__main__":
    unittest.main()
