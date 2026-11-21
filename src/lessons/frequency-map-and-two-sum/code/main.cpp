#include <unordered_map>
#include <vector>

std::unordered_map<int, int> count(const std::vector<int>& nums) { // @a count.sig
    std::unordered_map<int, int> count;
    for (int x : nums)                              // @a count.loop
        count[x]++;                                 // @a count.bump
    return count;                                   // @a count.return
}

std::vector<int> twoSum(const std::vector<int>& nums, int target) { // @a two.sig
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {    // @a two.loop
        int need = target - nums[i];                // @a two.need
        auto it = seen.find(need);                  // @a two.check
        if (it != seen.end()) return {it->second, i}; // @a two.found
        seen[nums[i]] = i;                          // @a two.store
    }
    return {};                                      // @a two.none
}
