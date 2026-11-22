class MinHeap:
    def __init__(self):
        self.a = []

    def push(self, v):                              # @a push.sig
        a = self.a
        a.append(v)                                 # @a push.add
        i = len(a) - 1                              # @a push.add
        while i > 0:
            p = (i - 1) // 2                        # @a up.cmp
            if a[p] <= a[i]: break                  # @a up.stop
            a[i], a[p] = a[p], a[i]                 # @a up.swap
            i = p                                   # @a up.swap

    def pop(self):                                  # @a pop.sig
        a = self.a
        if not a: return None                       # @a pop.empty
        top = a[0]                                  # @a pop.take
        last = a.pop()                              # @a pop.last
        if a:
            a[0] = last                             # @a pop.last
        i = 0
        while True:
            l, r, m = 2 * i + 1, 2 * i + 2, i       # @a down.cmp
            if l < len(a) and a[l] < a[m]: m = l    # @a down.cmp
            if r < len(a) and a[r] < a[m]: m = r    # @a down.cmp
            if m == i: break                        # @a down.stop
            a[i], a[m] = a[m], a[i]                 # @a down.swap
            i = m                                   # @a down.swap
        return top                                  # @a pop.ret
