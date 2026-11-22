class TrieNode:
    def __init__(self):
        self.kids = {}
        self.end = False

class Autocomplete:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, w):                                # @a ins.sig
        n = self.root
        for c in w:
            n = n.kids.setdefault(c, TrieNode())        # @a ins.new
        n.end = True                                    # @a ins.end

    def complete(self, p):                              # @a ac.sig
        n = self.root
        for c in p:
            n = n.kids.get(c)                           # @a walk.step
            if n is None: return []                     # @a walk.miss
        out = []
        self.collect(n, p, out)                         # @a ac.collect
        return out                                      # @a ac.ret

    def collect(self, n, word, out):                    # @a dfs.sig
        if n.end: out.append(word)                      # @a dfs.word
        for c in sorted(n.kids):
            self.collect(n.kids[c], word + c, out)      # @a dfs.down
