class Node:
    def __init__(self, val):
        self.val, self.h, self.left, self.right = val, 1, None, None

def h(n): return n.h if n else 0
def bf(n): return h(n.left) - h(n.right)   # balance factor

def rotate_right(z):
    y = z.left                     # @a rot.r
    z.left = y.right               # @a rot.r
    y.right = z                    # @a rot.r
    z.h = 1 + max(h(z.left), h(z.right))
    y.h = 1 + max(h(y.left), h(y.right))
    return y

def rotate_left(z):
    y = z.right                    # @a rot.l
    z.right = y.left               # @a rot.l
    y.left = z                     # @a rot.l
    z.h = 1 + max(h(z.left), h(z.right))
    y.h = 1 + max(h(y.left), h(y.right))
    return y

def insert(n, v):                                  # @a ins.sig
    if n is None: return Node(v)                   # @a ins.leaf
    if v < n.val: n.left = insert(n.left, v)       # @a ins.cmp
    elif v > n.val: n.right = insert(n.right, v)   # @a ins.cmp
    else: return n                                 # @a ins.dup
    n.h = 1 + max(h(n.left), h(n.right))           # @a fix.h
    b = bf(n)                                      # @a fix.bf
    if b > 1 and v < n.left.val: return rotate_right(n)     # @a case.ll
    if b < -1 and v > n.right.val: return rotate_left(n)    # @a case.rr
    if b > 1:                                      # @a case.lr
        n.left = rotate_left(n.left); return rotate_right(n)   # @a case.lr
    if b < -1:                                     # @a case.rl
        n.right = rotate_right(n.right); return rotate_left(n) # @a case.rl
    return n                                       # @a ins.ret
