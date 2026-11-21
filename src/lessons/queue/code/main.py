class ArrayQueue:
    def __init__(self):
        self.data = [0] * 4
        self.head = 0
        self.size = 0

    def offer(self, x):                           # @a offer.sig
        if self.size == len(self.data):           # @a offer.check
            raise OverflowError("queue is full")
        self.data[(self.head + self.size) % len(self.data)] = x   # @a offer.write
        self.size += 1                            # @a offer.size

    def poll(self):                               # @a poll.sig
        if self.size == 0:                        # @a poll.check
            return None
        x = self.data[self.head]                  # @a poll.read
        self.head = (self.head + 1) % len(self.data)   # @a poll.head
        self.size -= 1                            # @a poll.size
        return x                                  # @a poll.return

    def peek(self):                               # @a peek.sig
        return None if self.size == 0 else self.data[self.head]   # @a peek.return
