class ArrayStack:
    def __init__(self):
        self.data = [0] * 6
        self.top = -1

    def push(self, x):                            # @a push.sig
        if self.top == len(self.data) - 1:        # @a push.check
            raise OverflowError("stack is full")
        self.top += 1
        self.data[self.top] = x                   # @a push.write

    def pop(self):                                # @a pop.sig
        if self.top == -1:                        # @a pop.check
            raise IndexError("stack is empty")
        x = self.data[self.top]
        self.top -= 1
        return x                                  # @a pop.return

    def peek(self):                               # @a peek.sig
        if self.top == -1:                        # @a peek.check
            raise IndexError("stack is empty")
        return self.data[self.top]                # @a peek.return
