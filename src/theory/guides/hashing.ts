import type { Guide } from "../types";

const hashing: Guide = {
  section: "hashing",
  tagline: "How a hash function turns a key into an array index, so you can store and find items in about one step on average.",
  core: [
    "Say you store the numbers 12, 7 and 3, and later ask whether 7 is there. Scanning a list checks every item. Instead, compute `7 % 5 = 2` and look only in slot 2 of an array. The question costs **one calculation and a short look on average**, however many numbers you stored, as long as the table grows as it fills.",
    "That calculation is a **hash function**. It turns a key, the thing you look up, into a bucket number, an index into an array. A set stores keys only. A map stores a value with each key, such as a name with a phone number. Both are built this way.",
    "Two keys can land in the same bucket, as 12 and 7 do with `% 5`. That is a collision. Chaining keeps a short list in each bucket. Open addressing puts the key in the next free slot. While buckets stay short, insert, lookup and delete **cost O(1) on average**. If every key collides, they cost O(n)."
  ],
  analogy:
    "Picture a coat check with numbered hooks. The attendant does not search every hook for your coat. Your ticket number says which hook to go to. If two coats share a hook, the attendant checks the few coats on it. A hash table works like that: the hash is the ticket, and a collision is a crowded hook.",
  prereqs: [
    "The [[arrays]] lesson: why reading `a[i]` is one step. A hash table is an array you index by a computed number.",
    "The [[guide:linear|Linear structures guide]], for the linked lists that chaining keeps in each bucket.",
    "The `%` operator, which gives the remainder after division. `12 % 5` is 2."
  ],
  terms: [
    ["key", "The thing you store or look up, such as a username or a number. In a set, it is the whole item."],
    ["value", "The data a map keeps with each key, such as the phone number stored under a name."],
    ["set", "A collection that holds each key at most once and answers \"is this key here?\"."],
    ["map", "A collection of key and value pairs. You give it a key, and it returns the value. Also called a dictionary."],
    ["hash function", "A function that turns a key into a number. The same key always gives the same number. `key % 5` is a small example."],
    ["bucket", "One slot of the table's array. The hash of a key says which bucket the key belongs in."],
    ["collision", "Two different keys that hash to the same bucket. With `% 5`, the keys 12 and 7 both go to bucket 2."],
    ["load factor", "The number of stored keys divided by the number of buckets. 4 keys in 5 buckets is a load factor of 0.8."],
    ["chaining", "A way to handle collisions. Each bucket holds a linked list, called its chain, of every key that hashed there."],
    ["open addressing", "A way to handle collisions where every key sits in the array itself. A taken slot sends the key to another slot."],
    ["probe", "One look at a slot while searching for a key or a free place under open addressing."],
    ["linear probing", "Open addressing that tries the next slot, then the one after, wrapping from the last slot back to slot 0."],
    ["tombstone", "A marker left in a slot when a key is removed under open addressing. It says \"something was here, keep searching\"."],
    ["resize (rehash)", "Making a bigger array when the load factor gets too high, then moving every key into it by hashing it again."],
    ["average case", "The expected cost over typical inputs. O(1) average lookup assumes the hash spreads keys evenly."],
    ["amortized", "The cost averaged over a long run of operations, where a rare expensive step is paid for by many cheap ones."]
  ],
  cheat: {
    head: ["Operation", "Time", "Extra space", "Note"],
    rows: [
      ["Insert, lookup, delete", "O(1) average, O(n) worst", "O(1)", "One hash, then a short bucket. The worst case is every key in one bucket, so you scan them all."],
      ["Resize (rehash)", "O(n) once, O(1) amortized per insert", "O(n)", "Every key moves to the new array. Doubling the size makes resizes rare, so the cost spreads across many inserts."],
      ["Count frequencies", "O(n) average", "O(k) for `k` distinct values", "One pass over the input, with one O(1) average map update per item. O(n²) worst if every key collides."],
      ["Two-sum with a map", "O(n) average", "O(n)", "One pass and one lookup per item. Checking every pair instead costs O(n²) time."]
    ]
  },
  patterns: [
    ["\"Have I seen this before?\", such as a repeated number or a taken name.", "Use a set, or a map if you also need data about it. See [[hash-table-chaining]]."],
    ["Count how often each thing appears.", "Use a frequency map from item to count. See [[frequency-map-and-two-sum]]."],
    ["Find a partner value fast, such as two numbers that add up to a target.", "Store what you have seen in a map, then look up the partner you need. See [[frequency-map-and-two-sum]]."]
  ],
  tips: [
    "A bad hash function makes everything collide. If every key lands in one bucket, each lookup scans all of them and costs O(n).",
    "Deleting under open addressing needs a tombstone. Emptying the slot would cut the probe path, and keys placed past it become unfindable.",
    "Keep the load factor low. Many tables resize when it passes about 0.75, because longer chains and probe paths cost more steps.",
    "Do not change a key after you store it. Its hash changes too, so the table looks in the wrong bucket and cannot find it.",
    "Do not rely on the order of keys. A hash table keeps them by bucket, not in the order you added them or in sorted order."
  ],
  cases: [
    {
      title: "Checking whether a username is taken",
      setting: "A sign-up form has millions of accounts. When you type a name, it must say at once whether someone already has it.",
      idea: "The server keeps every username in a hash set. It hashes the typed name and checks one bucket.",
      why: "The answer costs O(1) on average however many accounts exist. Scanning a list of millions would grow with every new account."
    },
    {
      title: "Caching a slow lookup",
      setting: "A weather app asks a slow server for each city's forecast. Many people ask about the same few cities.",
      idea: "A map from city name to forecast keeps each answer once it arrives. A later request checks the map before calling the server.",
      why: "A map hit costs O(1) on average, far less than a trip to the server. The [[guide:linear|LRU cache]], which drops the answer unused for longest, adds a list to do that."
    },
    {
      title: "Counting word frequency in a text",
      setting: "You want the ten most common words in a book of 100,000 words.",
      idea: "Walk the text once. For each word, add 1 to its count in a map from word to count.",
      why: "Each update is O(1) on average, so the whole count is O(n) on average. Comparing every word with every other word would cost O(n²)."
    }
  ],
  hooks: {
    "hash-table-chaining": "Hash a key to one of 5 buckets, then scan only that bucket's short chain.",
    "open-addressing": "Keep every key in one array of 7 slots, probe past collisions, and leave tombstones on removal.",
    "frequency-map-and-two-sum": "Count values in one pass, then find a pair that sums to a target without trying every pair."
  }
};

export default hashing;
