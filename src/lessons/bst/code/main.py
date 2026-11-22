class Node:
    def __init__(self, val):
        self.val, self.left, self.right = val, None, None

class BST:
    def __init__(self):
        self.root = None

    def insert(self, v):                                # @a ins.sig
        if self.root is None:
            self.root = Node(v); return True            # @a ins.root
        cur = self.root
        while True:
            if v == cur.val: return False               # @a ins.dup
            if v < cur.val:                             # @a ins.cmp
                if cur.left is None:
                    cur.left = Node(v); return True     # @a ins.attach
                cur = cur.left
            else:
                if cur.right is None:
                    cur.right = Node(v); return True    # @a ins.attach
                cur = cur.right

    def search(self, v):                                # @a find.sig
        cur = self.root
        while cur:
            if v == cur.val: return True                # @a find.hit
            cur = cur.left if v < cur.val else cur.right  # @a find.step
        return False                                    # @a find.miss

    def delete(self, n, v):                             # @a del.sig
        if n is None: return None                       # @a del.miss
        if v < n.val: n.left = self.delete(n.left, v)   # @a del.step
        elif v > n.val: n.right = self.delete(n.right, v)  # @a del.step
        else:
            if not n.left and not n.right: return None  # @a del.leaf
            if not n.left: return n.right               # @a del.one
            if not n.right: return n.left               # @a del.one
            s = n.right                                 # @a del.succ
            while s.left: s = s.left                    # @a del.succ
            n.val = s.val                               # @a del.copy
            n.right = self.delete(n.right, s.val)       # @a del.drop
        return n
