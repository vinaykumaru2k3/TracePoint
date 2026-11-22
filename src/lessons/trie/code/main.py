class TrieNode:
    def __init__(self):
        self.kids = {}
        self.end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, w):                        # @a ins.sig
        n = self.root                           # @a ins.root
        for c in w:
            if c not in n.kids:                 # @a ins.new
                n.kids[c] = TrieNode()          # @a ins.new
            n = n.kids[c]                       # @a ins.step
        n.end = True                            # @a ins.end

    def walk(self, s):                          # @a walk.sig
        n = self.root
        for c in s:
            n = n.kids.get(c)                   # @a walk.step
            if n is None: return None           # @a walk.miss
        return n                                # @a walk.ret

    def search(self, w):                        # @a find.sig
        n = self.walk(w)
        return n is not None and n.end          # @a find.end

    def starts_with(self, p):                   # @a pre.sig
        return self.walk(p) is not None         # @a pre.ret
