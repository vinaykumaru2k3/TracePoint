def safe(cols, row, c):
    return all(q != c and abs(q - c) != row - r for r, q in enumerate(cols))

def solve(n, row, cols):                       # @a nq.sig
    if row == n: return True                   # @a nq.done
    for c in range(n):                         # @a nq.loop
        if safe(cols, row, c):                 # @a nq.safe
            cols.append(c)                     # @a nq.place
            if solve(n, row + 1, cols): return True
            cols.pop()                         # @a nq.lift
    return False

cols = []
if not solve(4, 0, cols): print("no solution")  # @a nq.none
