class IntArray:
    def __init__(self):
        self.data = [0] * 7
        self.size = 0

    def get(self, i):                                  # @a get.sig
        if not 0 <= i < self.size:                     # @a get.check
            raise IndexError("index out of range")
        return self.data[i]                            # @a get.return

    def append(self, x):                               # @a append.sig
        if self.size == len(self.data):                # @a append.check
            raise OverflowError("full")
        self.data[self.size] = x; self.size += 1       # @a append.write

    def insert(self, i, x):                            # @a insert.sig
        if self.size == len(self.data) or not 0 <= i <= self.size:  # @a insert.check
            raise IndexError("index out of range")
        for k in range(self.size, i, -1):
            self.data[k] = self.data[k - 1]            # @a insert.shift
        self.data[i] = x                               # @a insert.write
        self.size += 1

    def remove(self, i):                               # @a remove.sig
        if not 0 <= i < self.size:                     # @a remove.check
            raise IndexError("index out of range")
        x = self.data[i]
        for k in range(i, self.size - 1):
            self.data[k] = self.data[k + 1]            # @a remove.shift
        self.size -= 1                                 # @a remove.done
        return x
