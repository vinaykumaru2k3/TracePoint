class Node:
    def __init__(self, val):
        self.val = val
        self.prev = self.next = None

class DoublyLinkedList:
    def __init__(self):
        self.head = self.tail = None

    def add_first(self, x):                     # @a addFirst.sig
        n = Node(x)                             # @a addFirst.new
        n.next = self.head                      # @a addFirst.link
        if self.head: self.head.prev = n        # @a addFirst.back
        else: self.tail = n
        self.head = n                           # @a addFirst.head

    def add_last(self, x):                      # @a addLast.sig
        n = Node(x)                             # @a addLast.new
        n.prev = self.tail                      # @a addLast.link
        if self.tail: self.tail.next = n        # @a addLast.back
        else: self.head = n
        self.tail = n                           # @a addLast.tail

    def remove_first(self):                     # @a removeFirst.sig
        if self.head is None:                   # @a removeFirst.check
            raise IndexError("empty")
        x = self.head.val
        self.head = self.head.next              # @a removeFirst.move
        if self.head: self.head.prev = None     # @a removeFirst.cut
        else: self.tail = None
        return x

    def remove_last(self):                      # @a removeLast.sig
        if self.tail is None:                   # @a removeLast.check
            raise IndexError("empty")
        x = self.tail.val
        self.tail = self.tail.prev              # @a removeLast.move
        if self.tail: self.tail.next = None     # @a removeLast.cut
        else: self.head = None
        return x
