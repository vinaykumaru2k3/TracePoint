class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class SinglyLinkedList:
    def __init__(self):
        self.head = self.tail = None

    def add_first(self, x):                     # @a addFirst.sig
        n = Node(x)                             # @a addFirst.new
        n.next = self.head                      # @a addFirst.link
        self.head = n                           # @a addFirst.head
        if self.tail is None:
            self.tail = n

    def add_last(self, x):                      # @a addLast.sig
        n = Node(x)                             # @a addLast.new
        if self.tail is None:                   # @a addLast.empty
            self.head = self.tail = n
            return
        self.tail.next = n                      # @a addLast.link
        self.tail = n                           # @a addLast.tail

    def contains(self, x):                      # @a contains.sig
        cur = self.head
        while cur is not None:                  # @a contains.walk
            if cur.val == x:                    # @a contains.hit
                return True
            cur = cur.next
        return False                            # @a contains.miss

    def delete(self, x):                        # @a delete.sig
        prev, cur = None, self.head
        while cur is not None and cur.val != x: # @a delete.walk
            prev, cur = cur, cur.next
        if cur is None:                         # @a delete.miss
            return False
        if prev is None:                        # @a delete.head
            self.head = cur.next
        else:                                   # @a delete.unlink
            prev.next = cur.next
        if cur is self.tail:                    # @a delete.tail
            self.tail = prev
        return True
