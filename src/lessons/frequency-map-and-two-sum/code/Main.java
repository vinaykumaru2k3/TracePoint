import java.util.*;

class Maps {
    static Map<Integer, Integer> count(int[] nums) {      // @a count.sig
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : nums)                                // @a count.loop
            count.merge(x, 1, Integer::sum);              // @a count.bump
        return count;                                     // @a count.return
    }

    static int[] twoSum(int[] nums, int target) {         // @a two.sig
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {           // @a two.loop
            int need = target - nums[i];                  // @a two.need
            Integer j = seen.get(need);                   // @a two.check
            if (j != null) return new int[] { j, i };     // @a two.found
            seen.put(nums[i], i);                         // @a two.store
        }
        return null;                                      // @a two.none
    }
}
