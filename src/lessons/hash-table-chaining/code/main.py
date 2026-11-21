class ChainedHashSet:
    def __init__(self):
        self.buckets = [[] for _ in range(5)]

    def hash(self, key):                        # @a hash
        return key % 5

    def add(self, key):                         # @a add.sig
        b = self.buckets[self.hash(key)]        # @a add.bucket
        for k in b:                             # @a add.scan
            if k == key:                        # @a add.dup
                return False
        b.append(key)                           # @a add.append
        return True

    def contains(self, key):                    # @a contains.sig
        for k in self.buckets[self.hash(key)]:  # @a contains.scan
            if k == key:                        # @a contains.hit
                return True
        return False                            # @a contains.miss

    def remove(self, key):                      # @a remove.sig
        b = self.buckets[self.hash(key)]        # @a remove.bucket
        for i, k in enumerate(b):               # @a remove.scan
            if k == key:                        # @a remove.hit
                del b[i]
                return True
        return False                            # @a remove.miss
