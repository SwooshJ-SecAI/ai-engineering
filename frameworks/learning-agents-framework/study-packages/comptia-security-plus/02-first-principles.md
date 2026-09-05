# CompTIA Security+ (SY0-701) — First Principles

Six concepts that candidates usually memorize and therefore get wrong under scenario pressure. Here they are reasoned from fundamentals.

---

## 1. Why asymmetric encryption exists at all

Start with the problem symmetric encryption cannot solve. Symmetric encryption uses one key for both locking and unlocking. It is fast and strong. But it has a fatal logistics flaw: to send someone an encrypted message, they need the same key — and how do you get the key to them securely? If you send the key over the same untrusted channel, an eavesdropper captures it and the encryption is worthless.

Now reason toward the solution. What if locking and unlocking used *different* keys, mathematically linked so that what one locks only the other can unlock? Then you could publish one key openly (the public key) and keep the other secret (the private key). Anyone can lock a message with your public key, but only you can unlock it with your private key. The key-distribution problem disappears, because the public key being public is harmless.

The cost is speed — the math is expensive. So real systems use asymmetric encryption only to exchange a symmetric key, then switch to fast symmetric encryption for the actual data. Once you see this, TLS stops being a list of steps and becomes obvious: the handshake is just solving key distribution.

## 2. Why hashing is not encryption

Candidates conflate them because both "scramble" data. The difference is directionality and purpose.

Encryption is reversible by design — the whole point is that the authorized party can get the original back. Hashing is deliberately irreversible — it is a one-way function producing a fixed-length digest. You cannot get the input back from a hash; you can only take a candidate input, hash it, and compare.

This is exactly why hashing is correct for password storage. You never need the original password back — you only need to check whether a login attempt matches. So you store the hash, hash each attempt, and compare. If the database leaks, the attacker has hashes, not passwords. Encryption would be wrong here because a reversible store means a stolen key exposes every password.

Salting closes the last gap: without it, identical passwords hash identically, so an attacker can precompute hashes (rainbow tables) once and match many accounts. A unique random salt per password makes every hash unique, forcing the attacker to attack each one individually.

## 3. Why MFA defeats stolen passwords

Reason about what a password actually is: a single secret in one category — something you know. Its weakness is that it can be copied without you knowing (phished, keylogged, leaked in a breach) and a copy works exactly like the original.

The fix is not a better password — it is a second secret of a *different kind*. Something you have (a phone, a token) cannot be copied by a remote phisher, because possession is physical. Something you are (biometric) is not transmittable as a reusable secret. So even if the attacker captures your password, they lack the second factor, and one factor alone fails the check.

The critical exam nuance: the factors must be from *different categories*. Two passwords are not MFA — both are "something you know," and one phishing attack captures both. A password plus a hardware token is MFA because compromising one does not compromise the other.

## 4. Why you contain before you eradicate

Incident response ordering feels arbitrary until you reason about time and damage. When a host is compromised and spreading, every minute of delay means more systems infected, more data exfiltrated, more blast radius.

Eradication (fully removing the threat and root cause) is careful, slow work — you must find every artifact, close the vulnerability, and verify. If you insist on eradicating first, the threat keeps spreading during the hours that takes.

Containment is fast and blunt — isolate the host from the network, block the command-and-control domain. It stops the bleeding immediately even though the threat still technically exists on the isolated box. So you contain first to cap the damage, then eradicate at the careful pace it requires. This is triage logic: stop the spread, then treat the wound.

## 5. Why least privilege limits breach impact

Think about what an attacker gets when they compromise an account: exactly that account's permissions, no more. So the size of the disaster is determined by how much that account could do.

If every user has broad access "for convenience," then compromising any single account is catastrophic — the attacker inherits broad access instantly. If each account has only what its job requires, compromising it yields a small, contained set of permissions. The attacker then has to compromise more accounts or escalate privilege, which creates more activity and more chances to be detected.

Least privilege is therefore not about distrust of users — it is about capping the blast radius of the inevitable compromise. You assume accounts will be breached and design so that a breach is survivable.

## 6. Why zero-days force defense in depth

A zero-day is a vulnerability with no patch. Reason about what that removes from your toolkit: patching, the primary fix, is unavailable. You literally cannot close the hole directly.

So what is left? Everything that does not depend on knowing the specific flaw. Network segmentation limits where the exploit can reach. Least privilege limits what the exploited process can do. Behavior-based monitoring can catch the *effects* of exploitation (unusual process spawning, unexpected network connections) even without a signature for the exploit itself. Backups let you recover if it succeeds.

This is the entire argument for defense in depth in one case: because you cannot count on any single control being effective against an unknown threat, you stack independent controls so that the failure of the one that would normally stop it does not equal total compromise.

---

*Generated by the Learning Agents Framework V2.*
