 
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-HASH u101)
(define-constant ERR-INVALID-TITLE u102)
(define-constant ERR-INVALID-DESCRIPTION u103)
(define-constant ERR-INVALID-METADATA u104)
(define-constant ERR-ARTWORK-ALREADY-EXISTS u105)
(define-constant ERR-ARTWORK-NOT-FOUND u106)
(define-constant ERR-INVALID-CATEGORY u107)
(define-constant ERR-INVALID-CREATED-AT u108)
(define-constant ERR-INVALID-OWNER u109)
(define-constant ERR-TRANSFER-NOT-ALLOWED u110)
(define-constant ERR-INVALID-RECIPIENT u111)
(define-constant ERR-MAX-ARTWORKS-EXCEEDED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-UPDATE-NOT-AUTHORIZED u114)
(define-constant ERR-INVALID-STATUS u115)
(define-constant ERR-INVALID-TAG u116)
(define-constant ERR-INVALID-MEDIUM u117)
(define-constant ERR-INVALID-DIMENSIONS u118)
(define-constant ERR-INVALID-FILE-TYPE u119)
(define-constant ERR-INVALID-ROYALTY-RATE u120)

(define-data-var next-artwork-id uint u0)
(define-data-var max-artworks uint u1000000)
(define-data-var registration-fee uint u100)
(define-data-var authority-contract (optional principal) none)

(define-map artworks
  { hash: (buff 32) }
  {
    id: uint,
    owner: principal,
    title: (string-ascii 100),
    description: (string-ascii 500),
    metadata: {
      category: (string-ascii 50),
      created-at: uint,
      tags: (list 10 (string-ascii 20)),
      medium: (string-ascii 50),
      dimensions: (optional { width: uint, height: uint }),
      file-type: (string-ascii 20),
      royalty-rate: uint
    },
    timestamp: uint,
    status: bool
  }
)

(define-map artworks-by-id
  uint
  { hash: (buff 32) }
)

(define-map owner-artworks
  { owner: principal }
  { artworks: (list 100 uint) }
)

(define-map artwork-updates
  uint
  {
    update-title: (string-ascii 100),
    update-description: (string-ascii 500),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-artwork (hash (buff 32)))
  (map-get? artworks { hash: hash })
)

(define-read-only (get-artwork-by-id (id uint))
  (let ((hash-opt (map-get? artworks-by-id id)))
    (match hash-opt
      h (get-artwork h)
      none
    )
  )
)

(define-read-only (get-artwork-updates (id uint))
  (map-get? artwork-updates id)
)

(define-read-only (is-artwork-registered (hash (buff 32)))
  (is-some (map-get? artworks { hash: hash }))
)

(define-read-only (get-owner-artworks (owner principal))
  (default-to { artworks: (list) } (map-get? owner-artworks { owner: owner }))
)

(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-title (title (string-ascii 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (description (string-ascii 500)))
  (if (<= (len description) u500)
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-category (category (string-ascii 50)))
  (if (and (> (len category) u0) (<= (len category) u50))
      (ok true)
      (err ERR-INVALID-CATEGORY))
)

(define-private (validate-created-at (created-at uint))
  (if (<= created-at block-height)
      (ok true)
      (err ERR-INVALID-CREATED-AT))
)

(define-private (validate-tags (tags (list 10 (string-ascii 20))))
  (if (all (lambda (tag (string-ascii 20)) (<= (len tag) u20)) tags)
      (ok true)
      (err ERR-INVALID-TAG))
)

(define-private (validate-medium (medium (string-ascii 50)))
  (if (<= (len medium) u50)
      (ok true)
      (err ERR-INVALID-MEDIUM))
)

(define-private (validate-dimensions (dimensions (optional { width: uint, height: uint })))
  (match dimensions
    d (if (and (> (get width d) u0) (> (get height d) u0))
          (ok true)
          (err ERR-INVALID-DIMENSIONS))
    (ok true))
)

(define-private (validate-file-type (file-type (string-ascii 20)))
  (if (or (is-eq file-type "image/jpeg") (is-eq file-type "image/png") (is-eq file-type "audio/mp3") (is-eq file-type "video/mp4"))
      (ok true)
      (err ERR-INVALID-FILE-TYPE))
)

(define-private (validate-royalty-rate (rate uint))
  (if (<= rate u50)
      (ok true)
      (err ERR-INVALID-ROYALTY-RATE))
)

(define-private (validate-metadata (metadata { category: (string-ascii 50), created-at: uint, tags: (list 10 (string-ascii 20)), medium: (string-ascii 50), dimensions: (optional { width: uint, height: uint }), file-type: (string-ascii 20), royalty-rate: uint }))
  (try! (validate-category (get category metadata)))
  (try! (validate-created-at (get created-at metadata)))
  (try! (validate-tags (get tags metadata)))
  (try! (validate-medium (get medium metadata)))
  (try! (validate-dimensions (get dimensions metadata)))
  (try! (validate-file-type (get file-type metadata)))
  (try! (validate-royalty-rate (get royalty-rate metadata)))
  (ok true)
)

(define-private (validate-principal (p principal))
  (ok true)
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-artworks (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set max-artworks new-max)
    (ok true)
  )
)

(define-public (set-registration-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set registration-fee new-fee)
    (ok true)
  )
)

(define-public (register-artwork
  (hash (buff 32))
  (title (string-ascii 100))
  (description (string-ascii 500))
  (metadata { category: (string-ascii 50), created-at: uint, tags: (list 10 (string-ascii 20)), medium: (string-ascii 50), dimensions: (optional { width: uint, height: uint }), file-type: (string-ascii 20), royalty-rate: uint })
)
  (let (
        (next-id (var-get next-artwork-id))
        (current-max (var-get max-artworks))
        (authority (var-get authority-contract))
        (owner tx-sender)
        (owner-data (get-owner-artworks owner))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-ARTWORKS-EXCEEDED))
    (try! (validate-hash hash))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-metadata metadata))
    (asserts! (is-none (map-get? artworks { hash: hash })) (err ERR-ARTWORK-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-NOT-AUTHORIZED))))
      (try! (stx-transfer? (var-get registration-fee) tx-sender authority-recipient))
    )
    (map-set artworks { hash: hash }
      {
        id: next-id,
        owner: owner,
        title: title,
        description: description,
        metadata: metadata,
        timestamp: block-height,
        status: true
      }
    )
    (map-set artworks-by-id next-id { hash: hash })
    (map-set owner-artworks { owner: owner } { artworks: (append (get artworks owner-data) next-id) })
    (var-set next-artwork-id (+ next-id u1))
    (print { event: "artwork-registered", id: next-id, hash: hash })
    (ok next-id)
  )
)

(define-public (update-artwork
  (hash (buff 32))
  (update-title (string-ascii 100))
  (update-description (string-ascii 500))
)
  (let ((artwork (map-get? artworks { hash: hash })))
    (match artwork
      a
        (begin
          (asserts! (is-eq (get owner a) tx-sender) (err ERR-UPDATE-NOT-AUTHORIZED))
          (try! (validate-title update-title))
          (try! (validate-description update-description))
          (map-set artworks { hash: hash }
            (merge a {
              title: update-title,
              description: update-description,
              timestamp: block-height
            })
          )
          (map-set artwork-updates (get id a)
            {
              update-title: update-title,
              update-description: update-description,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "artwork-updated", id: (get id a), hash: hash })
          (ok true)
        )
      (err ERR-ARTWORK-NOT-FOUND)
    )
  )
)

(define-public (transfer-artwork-ownership
  (hash (buff 32))
  (recipient principal)
)
  (let ((artwork (map-get? artworks { hash: hash })))
    (match artwork
      a
        (begin
          (asserts! (is-eq (get owner a) tx-sender) (err ERR-TRANSFER-NOT-ALLOWED))
          (try! (validate-principal recipient))
          (map-set artworks { hash: hash }
            (merge a { owner: recipient })
          )
          (let (
            (old-owner tx-sender)
            (old-data (get-owner-artworks old-owner))
            (new-data (get-owner-artworks recipient))
          )
            (map-set owner-artworks { owner: old-owner } { artworks: (filter (lambda (id uint) (not (is-eq id (get id a)))) (get artworks old-data)) })
            (map-set owner-artworks { owner: recipient } { artworks: (append (get artworks new-data) (get id a)) })
          )
          (print { event: "artwork-transferred", id: (get id a), hash: hash, new-owner: recipient })
          (ok true)
        )
      (err ERR-ARTWORK-NOT-FOUND)
    )
  )
)

(define-public (get-artwork-count)
  (ok (var-get next-artwork-id))
)

(define-public (check-artwork-existence (hash (buff 32)))
  (ok (is-artwork-registered hash))
)