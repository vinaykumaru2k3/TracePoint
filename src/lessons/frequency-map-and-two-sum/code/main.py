def count(nums):                                # @a count.sig
    counts = {}
    for x in nums:                              # @a count.loop
        counts[x] = counts.get(x, 0) + 1        # @a count.bump
    return counts                               # @a count.return

def two_sum(nums, target):                      # @a two.sig
    seen = {}
    for i, x in enumerate(nums):                # @a two.loop
        need = target - x                       # @a two.need
        if need in seen:                        # @a two.check
            return [seen[need], i]              # @a two.found
        seen[x] = i                             # @a two.store
    return None                                 # @a two.none
