EMPTY, TOMB = None, object()

class LinearProbeSet:
    def __init__(self):
        self.slots = [EMPTY] * 7
        self.size = 0

    def hash(self, key):                        # @a hash
        return key % 7

    def add(self, key):                         # @a add.sig
        if self.size == len(self.slots):        # @a add.full
            return False
        i, tomb = self.hash(key), -1
        for _ in range(7):                      # @a add.probe
            if self.slots[i] is EMPTY:
                break
            if self.slots[i] == key:            # @a add.dup
                return False
            if self.slots[i] is TOMB and tomb < 0:  # @a add.tomb
                tomb = i
            i = (i + 1) % 7                     # @a add.next
        self.slots[tomb if tomb >= 0 else i] = key  # @a add.write
        self.size += 1
        return True

    def contains(self, key):                    # @a contains.sig
        i = self.hash(key)
        for _ in range(7):                      # @a contains.probe
            if self.slots[i] is EMPTY:
                break
            if self.slots[i] == key:            # @a contains.hit
                return True
            i = (i + 1) % 7                     # @a contains.next
        return False                            # @a contains.miss

    def remove(self, key):                      # @a remove.sig
        i = self.hash(key)
        for _ in range(7):                      # @a remove.probe
            if self.slots[i] is EMPTY:
                break
            if self.slots[i] == key:            # @a remove.hit
                self.slots[i] = TOMB
                self.size -= 1
                return True
            i = (i + 1) % 7                     # @a remove.next
        return False                            # @a remove.miss
