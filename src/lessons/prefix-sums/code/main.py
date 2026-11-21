class RangeSums:
    def __init__(self, a):                     # @a ps.sig
        self.p = [0] * (len(a) + 1)
        self.p[0] = 0                          # @a ps.zero
        for i in range(len(a)):                # @a ps.loop
            self.p[i + 1] = self.p[i] + a[i]   # @a ps.add

    # sum of a[l..r], both ends included
    def sum(self, l, r):
        return self.p[r + 1] - self.p[l]       # @a ps.query
