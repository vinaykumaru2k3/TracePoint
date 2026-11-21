def subsets(items, i, path, out):         # @a bt.sig
    if i == len(items):
        out.append(path[:]); return        # @a bt.leaf
    path.append(items[i])                  # @a bt.take
    subsets(items, i + 1, path, out)
    path.pop()                             # @a bt.undo
    subsets(items, i + 1, path, out)       # @a bt.skip
