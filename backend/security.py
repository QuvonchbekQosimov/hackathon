import hashlib
import hmac
import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHashError

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
def hash_password(password):
    return hasher.hash(password)
def verify_password(password, encoded):
    if encoded and encoded.startswith('$argon2id$'):
        try:
            return hasher.verify(encoded, password)
        except (VerificationError, InvalidHashError):
            return False
    try:
        kind, cost, salt, expected = encoded.split('$')
        if kind != 'scrypt' or cost != '16384':
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, AttributeError):
        return False

def needs_rehash(encoded):
    return not encoded.startswith('$argon2id$') or hasher.check_needs_rehash(encoded)
def session_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()
def public_user(user):
    return {k: user.get(k) for k in ('id', 'phone_number', 'role', 'company_name', 'first_name', 'last_name', 'email', 'address', 'created_at')}
