"""Python copy of R's set.seed() + sample() (Mersenne-Twister, R >= 3.6), so we can reproduce the
team's R train/test splits (set.seed(101); sample(1:n, floor(.85*n))) exactly."""
# Faithful re-implementation of R's set.seed(seed) + sample(1:n, size) (Mersenne-Twister, Rejection sampling, R >= 3.6)
import math
M32 = 0xFFFFFFFF
class RRNG:
    def __init__(self, seed):
        s = seed & M32
        for _ in range(50): s = (69069 * s + 1) & M32
        ints = []
        for _ in range(625):
            s = (69069 * s + 1) & M32; ints.append(s)
        self.mti = 624            # FixupSeeds: dummy[0] = 624
        self.mt = ints[1:]        # mt = dummy + 1
    def genrand(self):
        N, M = 624, 397
        mag01 = (0, 0x9908b0df)
        mt = self.mt
        if self.mti >= N:
            for kk in range(N - M):
                y = (mt[kk] & 0x80000000) | (mt[kk+1] & 0x7fffffff)
                mt[kk] = mt[kk+M] ^ (y >> 1) ^ mag01[y & 1]
            for kk in range(N - M, N - 1):
                y = (mt[kk] & 0x80000000) | (mt[kk+1] & 0x7fffffff)
                mt[kk] = mt[kk+(M-N)] ^ (y >> 1) ^ mag01[y & 1]
            y = (mt[N-1] & 0x80000000) | (mt[0] & 0x7fffffff)
            mt[N-1] = mt[M-1] ^ (y >> 1) ^ mag01[y & 1]
            self.mti = 0
        y = mt[self.mti]; self.mti += 1
        y ^= y >> 11
        y ^= (y << 7) & 0x9d2c5680
        y ^= (y << 15) & 0xefc60000
        y ^= y >> 18
        v = y * 2.3283064365386963e-10
        # fixup to (0,1)
        if v <= 0.0: return 0.5 * 2.328306437080797e-10
        if 1.0 - v <= 0.0: return 1.0 - 0.5 * 2.328306437080797e-10
        return v
    def rbits(self, bits):
        v = 0
        for n in range(0, bits + 1, 16):
            v1 = int(math.floor(self.genrand() * 65536))
            v = 65536 * v + v1
        one64 = 1
        return v & ((one64 << bits) - 1)
    def unif_index(self, dn):
        if dn <= 0: return 0
        bits = int(math.ceil(math.log2(dn)))
        while True:
            dv = self.rbits(bits)
            if dn > dv: return dv
    def sample(self, n, k):
        x = list(range(n)); y = []
        for _ in range(k):
            j = self.unif_index(n); y.append(x[j] + 1); x[j] = x[n - 1]; n -= 1
        return y

if __name__ == '__main__':
    r = RRNG(42); print([round(r.genrand(), 7) for _ in range(3)])   # R: set.seed(42); runif(3) -> 0.9148060 0.9370754 0.2861395
    r = RRNG(42); print(r.sample(10, 5))                                # R 3.6+: set.seed(42); sample(1:10,5) -> 1 5 10 8 2
