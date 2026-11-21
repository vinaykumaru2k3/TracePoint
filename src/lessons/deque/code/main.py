class ArrayDeque:
    def __init__(self):
        self.data = [0] * 6
        self.head = 0
        self.size = 0

    def push_front(self, x):                           # @a pushFront.sig
        if self.size == len(self.data):                # @a pushFront.check
            raise OverflowError("full")
        self.head = (self.head - 1) % len(self.data)   # @a pushFront.move
        self.data[self.head] = x                       # @a pushFront.write
        self.size += 1

    def push_back(self, x):                            # @a pushBack.sig
        if self.size == len(self.data):                # @a pushBack.check
            raise OverflowError("full")
        self.data[(self.head + self.size) % len(self.data)] = x  # @a pushBack.write
        self.size += 1

    def pop_front(self):                               # @a popFront.sig
        if self.size == 0:                             # @a popFront.check
            raise IndexError("empty")
        x = self.data[self.head]
        self.head = (self.head + 1) % len(self.data)   # @a popFront.move
        self.size -= 1
        return x

    def pop_back(self):                                # @a popBack.sig
        if self.size == 0:                             # @a popBack.check
            raise IndexError("empty")
        x = self.data[(self.head + self.size - 1) % len(self.data)]  # @a popBack.read
        self.size -= 1
        return x
