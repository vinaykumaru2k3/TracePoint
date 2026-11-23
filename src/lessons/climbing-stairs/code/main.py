def climb(n):
    ways = [0] * (n + 1)                          # @a stairs.init
    ways[0] = ways[1] = 1                         # @a stairs.base
    for i in range(2, n + 1):                     # @a stairs.loop
        ways[i] = ways[i - 1] + ways[i - 2]       # @a stairs.fill
    return ways[n]                                # @a stairs.ret
