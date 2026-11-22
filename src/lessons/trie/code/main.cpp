#include <string>
using namespace std;

struct TrieNode {
    TrieNode* kids[26] = {};
    bool end = false;
};

struct Trie {
    TrieNode* root = new TrieNode();

    void insert(const string& w) {              // @a ins.sig
        TrieNode* n = root;                     // @a ins.root
        for (char c : w) {
            int i = c - 'a';
            if (!n->kids[i])                    // @a ins.new
                n->kids[i] = new TrieNode();    // @a ins.new
            n = n->kids[i];                     // @a ins.step
        }
        n->end = true;                          // @a ins.end
    }

    TrieNode* walk(const string& s) {           // @a walk.sig
        TrieNode* n = root;
        for (char c : s) {
            n = n->kids[c - 'a'];               // @a walk.step
            if (!n) return nullptr;             // @a walk.miss
        }
        return n;                               // @a walk.ret
    }

    bool search(const string& w) {              // @a find.sig
        TrieNode* n = walk(w);
        return n && n->end;                     // @a find.end
    }

    bool startsWith(const string& p) {          // @a pre.sig
        return walk(p) != nullptr;              // @a pre.ret
    }
};
