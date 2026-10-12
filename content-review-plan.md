# Architecture Atlas: content review and remediation plan

Reviewed on 11 October 2026 against `main` at `5290e0f`: all 870 slides across the 10 tabs, plus the interview page. **Re-verified the same day.** Every fix was re-checked against the slide's source and, for version-sensitive facts, against primary documentation or framework source code. Section 11 lists what that second pass changed.

**Status, 12 October 2026: complete.** Phases 1 and 2 are implemented (all 40 items in section 3 and every row of section 4), and so are the 18 smaller fixes in section 8. Section 12 records where the implementation differs from the plan text.

**Decided, 12 October 2026: no to D1–D4.** Each tab keeps its own versions, and there is no new content and no build guards, so sections 5, 6 and 7 are dropped. The two version-independent bugs from section 5 were moved into section 8 and fixed there.

**How it was reviewed.** Every slide's text, code and diagram labels were extracted and read in full. Back-of-the-envelope numbers were re-derived, and code was traced by hand. Cross-tab claims were compared with each other. Version-sensitive facts were checked against primary sources (listed at the end). Each finding below names the `src/` file to edit.

**Labels used below**
- **[Wrong]**: factually incorrect, or the code does not do what the slide says.
- **[Outdated]**: was true for an older version, or is out of step with the version the tab claims.
- **[Conflict]**: two slides in the atlas say opposite things.
- **[Missing]**: a topic a reader at this level will be asked about, with no slide.
- **[Nit]**: wording, a typo, or a small code slip.

---

## 1. Verdict

The atlas is unusually strong. Most of it is accurate, and it is opinionated in the right places. In several tabs (Spring AI, Low-level design, Core Java, Java streams), every code listing was compiled and run, and those tabs have the fewest errors. The problems cluster in the three oldest tabs (Spring Boot, the Reference deck, Event-driven), whose code is not machine-checked. They are of three kinds:

1. **40 items to fix now** (section 3). Several sit in the very slides that warn against the mistake. For example, the outbox relay can lose events, and the `@PostFilter` example repeats the record-against-String bug the same slide warns about.
2. **A version baseline that has expired.** The Spring Boot tab is written for Boot 3.4/3.5 and the Event-driven tab's code is Boot 3.5. [Boot 3.5's open-source support ended on 30 June 2026](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/). Meanwhile the Reference deck and Spring AI tabs target Boot 4.1 and the header says "Spring Boot 4 · 2026".
3. **Gaps in coverage**, most notably observability (the Micrometer Observation API and OpenTelemetry) in the Spring Boot tab, a payment/ledger design in System design, and about ten common patterns in DSA.

| Tab | Slides | Quality | Fix now (§3) | New topics proposed (§6) |
|---|---:|---|---:|---:|
| Spring Boot | 56 | Good, needs a re-baseline | 17 | 10 |
| Reference deck | 68 | Good | 13 | 6 |
| Event-driven | 60 | Very good | 4 | 3 |
| Spring AI | 105 | Excellent | 4 | 3 |
| System design (HLD) | 166 | Excellent | 1 | 7 |
| Low-level design | 102 | Excellent | 0 | 6 |
| Core Java | 90 | Excellent | 0 | 3 |
| Java streams | 62 | Excellent | 0 | 0 |
| DSA patterns | 161 | Excellent | 0 | ~14 patterns |
| Interview prep | 17 pages | Very good | 1 | 2 |

---

## 2. Decisions needed from you before the work starts

**Outcome (12 October 2026): all four declined.** D1: the atlas is not moved to one baseline. D2: LLD stays on Java 21 and DSA on Java 17, with no note added. D3: no new content. D4: no build guards. The table below is kept as the original recommendation.

| # | Decision | Recommendation |
|---|---|---|
| **D1** | **One version baseline for the whole atlas?** Today each tab picks its own: Spring Boot tab 3.4/3.5, Event-driven Boot 3.5, Reference deck and Spring AI Boot 4.1, LLD JDK 21, DSA Java 17, Core Java and Streams JDK 25. | Yes. Move to **Boot 4.1 · Framework 7 · Java 25 · Hibernate 7 · Security 7 · JUnit 6 · Testcontainers 2**, and keep "Boot 3.x" callouts where the old behaviour still matters. Boot 3.5 now has commercial support only, so readers on a supported line are learning API names that no longer apply. |
| **D2** | **LLD and DSA Java level.** | Keep them on 21 and 17 for interview portability, but say so on each tab's first slide ("deliberately 21/17: what most interview IDEs run"). Then the difference reads as a choice, not drift. |
| **D3** | **How much new content?** Section 6 lists about 50 gap topics. | Do the P2-A items (about 20 slides) first. Treat the rest as a backlog. |
| **D4** | **Add build-time guards** (section 7)? | Yes. They are small changes to `build.mjs` and stop the commonest error types coming back. |

---

## 3. Phase 1: fix what is wrong (P0, no design decision needed)

### Spring Boot tab: `src/decks/springboot/`

| # | File | What is wrong | Fix |
|---|---|---|---|
| 1 | `04-core-annotations/05-async-scheduling-caching-testing.html` (trap note) | "`@Async` without an executor uses a `SimpleAsyncTaskExecutor` that creates an unbounded number of threads." In Boot, `@Async` uses the auto-configured `applicationTaskExecutor`, [a `ThreadPoolTaskExecutor` with 8 core threads](https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html) and an **unbounded queue**. With `spring.threads.virtual.enabled=true` it is a `SimpleAsyncTaskExecutor` on virtual threads. The plain Spring thread-per-task fallback is not Boot's default. The interview page (Q44, Numbers) already gets this right. | Rewrite the trap: the *queue*, not the thread count, is unbounded, so a backlog grows silently. Declaring any `Executor` bean makes the auto-configured one back off; keep it with `@Bean(defaultCandidate = false)`. |
| 2 | same file, Boot 4 box | Says Framework 7's `@Retryable` lives in `org.springframework.core.retry`. That package holds `RetryTemplate` and `RetryPolicy`; the annotations are in [`org.springframework.resilience.annotation`](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/resilience/annotation/EnableResilientMethods.html). | Correct the package. |
| 3 | same file | The dek says *everything* in the left column works through the proxy and does nothing on a `final` class. `@Scheduled` and `@EventListener` are registered by bean post-processors, not proxies, so self-invocation does not apply to them. `@TransactionalEventListener` is shown without saying the event is **dropped** when no transaction is active (unless `fallbackExecution = true`). `@DynamicPropertySource` is shown without `@ServiceConnection` (Boot 3.1+). | Narrow the dek to the proxy-based annotations (`@Async`, `@Cacheable`, `@Retryable`, `@Transactional`). Add the two missing notes. |
| 4 | `02-lifecycle/03-bean-lifecycle.html` (Proxy type card) | "CGLIB cannot proxy `final` classes or `final`/`private` methods — the annotation is silently ignored." Only final or private **methods** are skipped silently. A **final class** makes CGLIB proxy creation fail at startup. `07-internals/02-aop-limits.html` already says bean creation fails. | Split the two cases (and fix the same phrase in #3's dek). |
| 5 | `05-jpa/01-entity-basics.html` | "`updatable = false` … is genuinely enforced by Hibernate and catches bugs." Hibernate silently **omits** the column from the UPDATE: the change is discarded and no error is raised. | Reword: it protects the column, but silently, so a test should assert the value. |
| 6 | `05-jpa/03-relationships.html` | `@OneToOne(mappedBy = "order", fetch = LAZY, optional = false)` is presented as fine. The [Hibernate 7.1 user guide](https://docs.hibernate.org/orm/7.1/userguide/html_single/) states that LAZY cannot be honoured on the parent (`mappedBy`) side, because Hibernate cannot know whether the child exists without querying, so the association is loaded every time: a hidden N+1. | Add the warning. Recommend a unidirectional `@OneToOne` with `@MapsId` on the child, or bytecode enhancement. |
| 7 | `05-jpa/04-fetching.html` | Example 1 is `@EntityGraph(attributePaths = "lines") Page<…> findByCustomerId(…, Pageable)`, which is exactly the "pagination + collection fetch, applying in memory" trap the same slide warns about. | Change the example, or label it as the trap. Mention `hibernate.default_batch_fetch_size`. |
| 8 | `06-security/02-method-security.html` | `@PostFilter("… filterObject.customerId == authentication.name")` compares the `CustomerId` record to a String, the bug the slide warns about three lines earlier. So every non-OPS user gets an empty list. `@PreFilter` filters `List<OrderId>` by `.region`, a field `OrderId` does not have. | Use `.value()`. Filter a type that has `region`. |
| 9 | `06-security/05-tenancy-testing.html` (and the copy in `deck/07-cross-cutting/01-security.html`) | Tenant scoping with a Hibernate `@Filter` is presented as central and complete. Four gaps: **(a)** filters [do not apply to lookups by primary key](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/annotations/FilterDef.html) (`find()`/`findById`, `@ManyToOne` fetch) unless `@FilterDef(applyToLoadByKey = true)`, which is still incubating, so a cross-tenant read by id works. **(b)** The activator runs "once per request, from an interceptor", which only works with open-in-view **on**, and the atlas says to switch that off. With `spring.jpa.open-in-view=false`, `em.unwrap(Session.class)` outside a transaction throws `IllegalStateException: No transactional EntityManager available` ([source](https://raw.githubusercontent.com/spring-projects/spring-framework/main/spring-orm/src/main/java/org/springframework/orm/jpa/SharedEntityManagerCreator.java)). Inside a transaction, it covers only that one. **(c)** PostgreSQL RLS with `current_setting('app.tenant_id')` needs `SET LOCAL` per transaction on pooled connections. **(d)** The table owner bypasses RLS unless `FORCE ROW LEVEL SECURITY` is set or the app uses a non-owner role. | Add the caveats. Enable the filter per transaction (an aspect around `@Transactional`), or prefer Hibernate 6+ `@TenantId` with a `CurrentTenantIdentifierResolver`, which applies everywhere including load by id. |
| 10 | `07-internals/05-jackson-essentials.html` | **(a)** `@JsonFormat(shape = STRING, pattern = "…XXX") Instant placedAt` throws `UnsupportedTemporalTypeException` at serialization unless a zone is supplied, because an `Instant` cannot be formatted with a pattern and no zone. Supply it with `timezone = "UTC"` on the annotation or `spring.jackson.time-zone`. With no annotation at all, Boot already writes ISO-8601. **(b)** "`@JsonIgnore` … does not stop it being deserialised" is wrong: `@JsonIgnore` ignores the property **in both directions**. The real traps are an explicit `@JsonProperty` on another accessor of the same property, and `@JsonIgnoreProperties(allowSetters = true)`. | Fix both. The advice to use a separate request DTO still stands. |
| 11 | `04-core-annotations/03-web-mvc-annotations.html` and `04-validation.html` | **[Outdated]** A class-level `@Validated` on the controller "enables `@Min` on params", and the validation slide says to handle `ConstraintViolationException`. Since Framework 6.1 (Boot 3.2), MVC has built-in method validation, and the [Spring docs](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html) say to *remove* the class-level `@Validated` to use it. It then raises `HandlerMethodValidationException`, which also covers the `@Valid @RequestBody` errors on any method with a constrained parameter (e.g. `place(...)` with its `@NotBlank` header), so those stop arriving as `MethodArgumentNotValidException`. `Page<…>` is also returned straight from the controller, which Spring Data 3.3+ warns about. | Show the 6.1+ way and handle `HandlerMethodValidationException` (e.g. by extending `ResponseEntityExceptionHandler`). Return `PagedModel`, or use `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`. |
| 12 | `08-production/03-metrics.html` | `@Timed` on a service method records nothing without a `TimedAspect` bean or `management.observations.annotations.enabled=true`. | Add the requirement, and introduce `@Observed` (see the P2-A gaps). |
| 13 | `08-production/06-jvm-memory.html` | **(a)** "Platform threads cost ~1 MB of stack each, so 400 of them is 400 MB." `-Xss` is *reserved* address space; committed memory (what the container limit counts) is only the pages a thread has touched, usually far less. The interview page's Q63 ("up to about 1 MB") is the accurate wording. **(b)** Direct buffers are labelled "unbounded". By default, `-XX:MaxDirectMemorySize` equals the maximum heap, so on this 2 GiB pod they can add up to another 1.5 GiB. | Distinguish reserved from committed (NMT shows both). Replace "unbounded" with "capped at the heap size by default, so set `MaxDirectMemorySize`". |
| 14 | `09-reference/01-3-x-4-x-changes.html` | The Removals row says "Undertow WebSocket". Boot 4 [**dropped Undertow entirely**](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide), because it is not compatible with Servlet 6.1. Rows are also missing for these Boot 4 changes, all in the migration guide unless noted: `spring-boot-starter-web` deprecated in favour of `-webmvc`; per-technology test starters (`spring-boot-starter-<technology>-test`); JUnit 6; Jackson 3 (`tools.jackson`, annotations unchanged; Jackson 2 deprecated); Hibernate 7; Security 7; Spring Batch running in memory by default, with JDBC via `spring-boot-starter-batch-jdbc`; the new `spring-boot-starter-opentelemetry`; dependency management for Spring Retry removed (Spring Kafka and Spring Batch now retry on Framework 7 core retry). | Fix the row and add the missing ones. |
| 15 | `08-production/10-startup-time.html` | "Spring Data AOT · Boot 4 · None; on by default." The flag defaults to on, but [AOT repositories are generated only by AOT processing](https://docs.spring.io/spring-data/commons/reference/4.2/aot.html) (`process-aot`, plus `-Dspring.aot.enabled=true` on a JVM), so a plain `java -jar` gains nothing. | State the prerequisite. |
| 16 | `07-internals/02-aop-limits.html` | "Put `@Retryable` on the *caller* of the transactional method, not on the transactional method itself." Retry and transaction on the **same method** is fine. Spring Retry orders its advice at [`LOWEST_PRECEDENCE - 1`](https://raw.githubusercontent.com/spring-projects/spring-retry/main/src/main/java/org/springframework/retry/annotation/EnableRetry.java) specifically so that it runs outside `@Transactional`. Framework 7's [`RetryAnnotationBeanPostProcessor`](https://raw.githubusercontent.com/spring-projects/spring-framework/main/spring-context/src/main/java/org/springframework/resilience/annotation/RetryAnnotationBeanPostProcessor.java) adds its advisor *before* existing ones. Either way, each attempt gets a fresh transaction. The real trap is a `@Retryable` method that **joins a transaction its caller already opened** (propagation `REQUIRED`): every retry then runs inside the doomed outer transaction. The Reference deck's `03-backend/07` (same method) is correct. | Restate the rule: the retry must wrap the *outermost* transaction. Same method is fine; a caller's open transaction is not. |
| 17 | `05-jpa/02-keys.html` and `src/interview/007-q-data.html` (Q23, "Go deeper") | "Mismatch [of `allocationSize` and `INCREMENT BY`] = duplicate key errors that appear only under concurrency." Hibernate checks the sequence at boot, and [by default (`SequenceMismatchStrategy.EXCEPTION`)](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/cfg/MappingSettings.html) it refuses to start with a `MappingException`. If someone silences the check (`LOG`/`NONE`), the pooled optimizer hands out overlapping blocks, and even a single instance soon reuses ids. | "A mismatch stops the app at boot. Silence that check and you get duplicate keys, on one instance as well as many." |

### Reference deck: `src/decks/deck/`

| # | File | What is wrong | Fix |
|---|---|---|---|
| 18 | `02-modular-monolith/05-enforcing-it-with-archunit.html` | Rule 1 ignores only `..shop.(*).api..` and `..shop.shared..`, so the `spi` pattern taught two slides earlier (a pricing adapter implements `order.spi`) **fails this build rule**. It also fails `modules.verify()`, because `06-spring-modulith.html` exposes only `@NamedInterface("api")`. | Add `..shop.(*).spi..` to the ignore list, and `@NamedInterface("spi")` on `order/spi/package-info.java`. |
| 19 | `02-modular-monolith/08-events-that-cannot-be-lost.html` | `spring.modulith.republish-outstanding-events-on-restart` is [deprecated since 1.3 (still so in the 2.1 appendix)](https://docs.spring.io/spring-modulith/reference/appendix.html). It is now `spring.modulith.events.republish-outstanding-events-on-restart`, which the docs say is usually not recommended in multi-instance deployments. | Rename, and add the caveat. |
| 20 | `03-backend/03-use-case-and-transaction.html` | "A pool of 20 becomes an outage at 7 concurrent checkouts." With a 3-second hold, Little's law gives about 7 checkouts **per second**; 7 *concurrent* checkouts hold only 7 connections. | Correct the unit. |
| 21 | `03-backend/07-concurrency-and-idempotency.html` | The retry placement here is correct (see #16). The idempotency flow handles the same fingerprint, a different fingerprint, and success, but not a duplicate that arrives while the first request is still **IN_PROGRESS**: there is no stored response to return yet. It also does not say what happens to the key when the first attempt **fails**. | Add "IN_PROGRESS → 409 Conflict" (the [IETF Idempotency-Key draft](https://www.ietf.org/archive/id/draft-ietf-httpapi-idempotency-key-header-07.html) says 409, and 422 for reuse with a different payload, which the slide already has). Add "failure → delete the key or store the error". |
| 22 | `04-middleware/03-gateway-configuration.html` | `tracing.sampling.probability: 0.1  # 100% for errors via a custom sampler` is not possible: head sampling decides when a span starts, before any error exists. Keeping every error needs **tail sampling** in the OpenTelemetry collector, which the System design tab correctly says. The YAML also uses the `spring.cloud.gateway.*` root, which [Spring Cloud 2025.0](https://spring.io/blog/2025/05/29/spring-cloud-2025-0-0-is-abvailable) renamed to `spring.cloud.gateway.server.webflux.*` (see the [OpenRewrite mapping](https://docs.openrewrite.org/recipes/java/spring/cloud2025/springcloudgatewayproperties)). Boot 4 pairs with Spring Cloud 2025.1. | Fix the comment and the prefix. |
| 23 | `07-cross-cutting/03-observability.html` | The baseline YAML sets `management.otlp.tracing.endpoint`, which is the Boot 3 key. Boot 4 renamed it to `management.opentelemetry.tracing.export.otlp.endpoint` ([Spring blog](https://spring.io/blog/2025/11/18/opentelemetry-with-spring-boot/), [OpenRewrite 4.0 property recipe](https://docs.openrewrite.org/recipes/java/spring/boot4/springbootproperties_4_0)). The deck targets Boot 4.1. | Use the Boot 4 name. |
| 24 | `04-middleware/07-consumers-done-right.html` | The listener is `@Transactional` and calls `ack.acknowledge()` under the `MANUAL_IMMEDIATE` mode the slide recommends. That ack commits the offset synchronously, **inside the still-open database transaction**, so the comment "commit offset only after the work committed" is false. If the pod dies or the partition is revoked between the two commits, the record is never redelivered. Also, `ExponentialBackOffWithMaxRetries(3)` means 3 *retries*, so 4 deliveries, not "3 tries". | Use the shape from Event-driven `03-kafka-internals/07-offsets-commits.html`: the work commits in its own transaction, then ack. Fix the count. |
| 25 | `04-middleware/10-caching.html` | The listener evicts the local entry ("`// local`") and broadcasts to the other instances, but nothing shown evicts the **shared L2 (Redis) entry**. So the other instances refill L1 from a stale L2 for up to the 10-minute TTL, contradicting the slide's own "L2, event-evicted" row for prices. `cache.evict("product", sku)` is also not the Spring `Cache` API, and `cache` is undeclared. | Evict L2 as well, and show `cacheManager.getCache("product").evict(sku)`. |
| 26 | `05-data/02-zero-downtime-schema-change.html` | The backfill "`UPDATE … WHERE total_minor IS NULL LIMIT 10000`" fails, because PostgreSQL's UPDATE has no LIMIT (MySQL's does; this deck is PostgreSQL throughout). | Use `WHERE id IN (SELECT id … WHERE total_minor IS NULL LIMIT 10000)`. |
| 27 | `05-data/03-read-models.html`, `07-cross-cutting/05-testing-strategy.html` | **Stale hard-coded slide numbers.** "`/* slide 15 */`" now points at *The strangler fig*. "ArchUnit rules from slide 8 … `modules.verify()` from slide 9" now point at the api/spi and boundary-leak slides. ArchUnit and Modulith are slides 10 and 11. | Replace with `data-deck`/`data-slide` cross-references, which the build validates. |
| 28 | `06-frontend/02-angular-structure.html` | Labelled "Angular 20+", but it uses `rxResource({ request, loader })`. [Angular 20's `RxResourceOptions`](https://v20.angular.dev/api/core/rxjs-interop/RxResourceOptions) has `params` and `stream`. | Update to the Angular 20 API. |
| 29 | `07-cross-cutting/06-build-and-delivery.html` | `implementation(project(":modules:payment"))   // sees payment's api only` is false: a project dependency exposes every public class, and slide 02/02 says internal classes must be public. | Split into `payment-api` and `payment-impl` subprojects (or use JPMS `exports`) to get the compile-time wall the slide claims. |
| 30 | `07-cross-cutting/07-runtime-and-capacity.html` | "Virtual threads (Java 21+, on by default in Boot 4 when enabled)" contradicts itself. They are opt-in via `spring.threads.virtual.enabled`. | Reword. |

### Event-driven tab: `src/decks/events/`

| # | File | What is wrong | Fix |
|---|---|---|---|
| 31 | `02-guarantees/05-outbox-and-cdc.html` | The polling relay sends the batch, calls `kafka.flush()`, then marks **every row** sent. `flush()` only waits for the sends to complete; failures are reported through each send's future, not thrown. So failed rows are marked sent and those events are lost, on the slide whose purpose is not losing events. Separately, several relay pods with `SKIP LOCKED` publish different batches in parallel. That keeps them from double-sending but breaks per-aggregate order, while the table claims "Ordering: by id, per batch". | Join the futures. Mark only rows whose send succeeded, and stop at the first failure so later events for the same key are not published ahead of it. Add the ordering caveat (a single active relay, relays partitioned by aggregate, or CDC). |
| 32 | `02-guarantees/02-idempotency.html`, `02-guarantees/07-duplicates-late-events.html`, `05-at-scale/04-sagas-with-events.html`, `05-at-scale/05-projections.html` | Same as #24: a `@Transactional` listener that calls `ack.acknowledge()` inside the transaction. The atlas recommends `MANUAL_IMMEDIATE` everywhere (Spring Boot `03-starters/03`, deck `04-middleware/07`, this tab's `03-kafka-internals/07`), and under that mode the offset commits before the database does. `03-kafka-internals/07` itself shows the correct order. | Make every example follow 03/07 (transaction in the service, ack after it returns), or state that these listeners use `AckMode.MANUAL`, which defers the commit until the listener returns. |
| 33 | `05-at-scale/04-sagas-with-events.html` | The saga handler is `@Transactional` and calls `commands.send(new AuthorisePayment(…))`. That is a dual write, the tab's own anti-pattern, unless `commands` writes to an outbox, which the slide never says. The `@Scheduled` timeout sweeper also runs on every pod. `@Version` stops two pods committing the same state change, but not both sending the compensating command. | State that `commands` writes to the outbox (and that `compensate()` does too). Add `FOR UPDATE SKIP LOCKED` or ShedLock to the sweeper. |
| 34 | `04-spring/04-error-handling.html` | `ExponentialBackOffWithMaxRetries(3) // 3 attempts, then DLT` is 4 attempts. `addRetryableExceptions(TransientDataAccessException, ResourceAccessException)` does nothing: everything is retryable by default, and this call only re-classifies exceptions that were marked not-retryable (or everything, after `defaultFalse()`). | Fix the comment, and either drop the call or show it with `defaultFalse()`. |

### Spring AI tab: `src/decks/ai/`

| # | File | What is wrong | Fix |
|---|---|---|---|
| 35 | `11-rag/06-hybrid-search-and-re-ranking.html` | `HybridDocumentRetriever` runs vector and keyword search with **no tenant or ACL filter**, in a tab whose RAG slides insist the access filter goes on every search (`11-rag/01`, `11-rag/09`). | Thread the filter expression from `Query.context()` into both searches. The keyword index needs ACLs too. |
| 36 | `16-production/03-cost-control.html` | The semantic cache is listed as a cost lever with no mention of the risk. An answer cached for one user or tenant, built from their documents and tools, can be served to another (OWASP LLM02 sensitive-information disclosure, LLM08 vector and embedding weaknesses). | Key the cache by tenant and permission set. Never cache tool-backed or personal answers. |
| 37 | `15-enterprise-use-cases/07-compliance-checking-code.html` | Rules are retrieved by top-3 similarity, and the code does `if (rules.isEmpty()) continue;`. That gives **silent false negatives**: a clause that does not *look like* its rule is never judged, and the slide itself says recall matters most. | Classify the clause type, then apply every rule of that type. |
| 38 | `11-rag/08-evaluating-rag.html` | Faithfulness is judged against a fresh `similaritySearch(topK 5)` with no threshold and no filter, not against what `CitedAnswerService` actually used (topK 5, threshold 0.5). The judge can then pass an answer the assistant could not have grounded, or fail one it did. | Evaluate against the documents the assistant retrieved: return them, or reuse the same retriever. |

### System design and Interview prep

| # | File | What is wrong | Fix |
|---|---|---|---|
| 39 | `src/decks/hld/15-design-news-feed/01-requirements.html` | The feed cache is "500 post ids × 8 B × 300 M users ≈ 1.2 TB … a Redis cluster", which counts raw id bytes only. A Redis sorted set larger than `zset-max-listpack-entries` (128 by default) uses a skiplist plus a dict, roughly 80–100 B per entry. That makes it about **12–15 TB** of RAM. Raising the listpack threshold above the cap brings it to roughly 20 B per entry (**about 3 TB**), at the cost of O(n) inserts. The cap is also 500 in the estimate but "~800 items" in the Clarify box on the same slide and 800 in `02-api-and-data-model.html`. | Show the real figure and the encoding choice, and pick one cap. |
| 40 | `src/interview/008-q-integration.html` (Q29) | "Sampling at 10% with errors always sampled" has the same problem as #22. | Say "tail sampling at the collector". |

---

## 4. Phase 2: remove contradictions between tabs (P1)

| Topic | Says one thing | Says the other | Resolution |
|---|---|---|---|
| Version baseline | Header: "Spring Boot 4 · 2026"; Reference deck and Spring AI on Boot 4.1 | Spring Boot tab 3.4/3.5 (`01-architecture/01`); Event-driven code 3.5; LLD JDK 21; DSA Java 17 | **Closed: kept as is** (D1/D2 declined). `deck/01-foundations/01` already says that the versions differ by tab on purpose. |
| `@Async` default | Spring Boot `04-core-annotations/05`: SimpleAsyncTaskExecutor | Interview Q44 and Numbers: 8 threads, unbounded queue (correct) | Fix Spring Boot (#1). |
| Final class and proxies | Spring Boot `02-lifecycle/03`: silently ignored | Spring Boot `07-internals/02`: bean creation fails (correct) | #4. |
| `@Retryable` placement | Spring Boot `07-internals/02`: never on the transactional method | Deck `03-backend/07`: on the same method as `@Transactional` (correct, given the default advice order) | Fix Spring Boot (#16). |
| Burn-rate alerts | Deck `07-cross-cutting/04` and Interview Q66: 6 h at 6× opens a ticket | HLD `09-operate-and-secure/03`: pages (matches the Google SRE workbook, where 3 days at 1× is the ticket) | Align on HLD. |
| Error sampling | Deck `04-middleware/03` and Interview Q29: head sampling keeps errors | HLD `09-operate-and-secure/02`: tail sampling (correct) | #22, #40. |
| Graceful shutdown | Spring Boot `01-architecture/05`, `02-lifecycle/02` and `03-starters/02`: "set `server.shutdown: graceful`" (the first thing to set) | Interview Q61 and Numbers: the default since Boot 3.4 | Reword: it is the default; tune `spring.lifecycle.timeout-per-shutdown-phase` and the preStop sleep. |
| Testcontainers | Deck `07-cross-cutting/05`: 1.x `org.testcontainers.containers.PostgreSQLContainer<?>`, labelled "Boot 4 service connections" | AI `16-production/07`: 2.x `org.testcontainers.postgresql`. [Testcontainers 2.0](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.0) prefixes artifacts with `testcontainers-` and moves classes to `org.testcontainers.<module>`; Boot 4 manages 2.0 | Use the 2.x classes everywhere once D1 is decided. Date `@ServiceConnection` as Boot 3.1. |
| Kafka parallelism | Deck `04-middleware/06`, Event-driven `03-kafka-internals/05`: partitions cap parallelism | Event-driven `06-operations/09`: share groups (KIP-932) are GA in Kafka 4.2 and lift that cap | Add the share-group caveat where the cap is stated. |
| Isolation anomalies | Spring Boot `07-internals/04`: dirty read, non-repeatable read, phantom only | HLD `05-data/10`: also lost update and write skew | Add a cross-reference from Spring Boot to HLD. |
| Modulith registry | Deck `04-middleware/08`: a polling `SKIP LOCKED` relay, and "Spring Modulith's registry is exactly this"; Interview Q13: "exactly this pattern" | Deck `02-modular-monolith/08`: the registry logs the publication in the transaction and dispatches **in-process after commit**, republishing on restart | Say "an outbox-style publication log, dispatched in-process; not a polling relay". |
| Atlas overview | Deck `01-foundations/01` lists every tab… | …except DSA | Add DSA. |
| Study plan | Interview `017-plan.html` schedules Spring Boot, DSA, the Reference deck and Event-driven… | …but not System design, LLD, Core Java, Streams or Spring AI | Rebuild it per round type, across all tabs. |
| DSA structure | Patterns 01–27 have a "six in streams" slide (5 slides each); the orientation says "4 slides per pattern" | Patterns 28–30 (knapsack, grid DP, string DP) have no streams slide | Add the 3 slides and change the count to 5. |
| Numbered references | Streams `01-orientation/01`, `02-how-a-stream-runs/06`, `14-interview-questions/02` say "slide 3/5" | Correct today, but they break on the next insert | Convert to cross-references. |

---

## 5. Phase 3: re-baseline the Spring Boot and Event-driven tabs (P1, depends on D1)

> **Dropped: D1 was declined.** The Spring Boot and Event-driven tabs stay on Boot 3.x. Two items below are bugs on any version, so they moved to section 8: the `@ConditionalOnExpression` default, and the `simpleDateFormat` example, which does not affect `java.time`. The rest is kept for reference only.

If you accept D1, this changes **API names**, not the teaching.

**Spring Boot tab**
- `01-architecture/01-what-this-tab-covers.html`: new baseline statement. "Boot 3.x" boxes replace the "Boot 4" boxes.
- `01-architecture/02`, `03-starters/02`: Undertow removed; `-web` becomes `-webmvc`; Security 7 and Hibernate 7 labels; JUnit 6 and the per-technology test starters.
- `01-architecture/05`, `07-internals/06`: `Jackson2ObjectMapperBuilderCustomizer` becomes `JsonMapperBuilderCustomizer` (Jackson 3, `tools.jackson`). Replace the `simpleDateFormat("yyyy-MM-dd")` example, which only affects `java.util.Date`, not `java.time`.
- `03-starters/01`: parent and plugin `3.5.0` become `4.1.x`.
- `03-starters/04`: the card promises "`BATCH_*` metadata tables that make a failed job resumable". In Boot 4, `spring-boot-starter-batch` runs in memory; restartability needs `spring-boot-starter-batch-jdbc`. The step example should use Spring Batch 6's [`ChunkOrientedStepBuilder`](https://docs.spring.io/spring-batch/reference/whatsnew.html): retry now uses Framework 7 core retry and skip uses `SkipPolicy`.
- `06-security/04`: mTLS via **SSL bundles** (`spring.ssl.bundle.*`, with reload) instead of raw `server.ssl.trust-store`.
- `07-internals/12`: `@ConditionalOnExpression("… '${spring.profiles.active}' …")` has no default, so startup fails when no profile is set. Add `${spring.profiles.active:}`, or better, use `@Profile("!test")`.
- `09-reference/01`: turn it around into a "4.x → what was different in 3.x" table.

**Event-driven tab**
- `01-foundations/01`: baseline statement.
- spring-kafka 4 on Boot 4: retry moved from Spring Retry to Framework core retry, and `spring.kafka.retry.topic.backoff.random` became `…backoff.jitter`.
- `group.protocol=consumer` (KIP-848) and the client properties it ignores.

**Reference deck:** Testcontainers 2 (section 4). The gateway prefix (#22) and the OTLP key (#23) are already in section 3.

---

## 6. Phase 4: fill the gaps (P2)

> **Dropped: D3 was declined.** No new content. The lists below are kept for reference only.

### P2-A: do these first (about 20 slides)

| Tab | New slide(s) | Why it is a gap |
|---|---|---|
| Spring Boot | **Observability**: the Observation API, `@Observed`, Micrometer Tracing with the OTel bridge, the Boot 4 OpenTelemetry starter, context propagation into `@Async` and Kafka | The tab's Production section has metrics and logs, but not the one API that produces both, plus traces. |
| Spring Boot | **HTTP clients**: `RestClient`, `@HttpExchange`/`@ImportHttpServices`, timeouts, SSL bundles | Covered only in the Reference deck; the Spring Boot tab is where people look. |
| Spring Boot | **Testing in depth**: `@ServiceConnection`, Docker Compose support, per-technology test starters, `RestTestClient`, the `@WebMvcTest` security-config import trap | Testing is one annotation list today. |
| Spring Boot | **Packaging and runtime**: Buildpacks/OCI images, layered jars, CDS/AOT cache, native, virtual-threads configuration and pinning | Scattered across the tab, with no single slide. |
| Spring Boot | **Database migrations**: Flyway compared with Liquibase, ownership, baseline-on-migrate | Flyway appears only in passing. |
| System design | **Payment system / ledger**: double-entry, idempotent PSP calls, reconciliation, auth expiry and re-auth | The most relevant missing design for an enterprise Java audience. |
| DSA | **Patterns 31–34**: Kadane / max subarray; stock "state machine" DP; two heaps (median); cyclic sort | Very common interview questions with no pattern. |
| Core Java | **How the GC works**: the generational hypothesis, G1 regions and mixed collections, ZGC load barriers, safepoints, TLABs | Senior Java rounds ask about the mechanics; the Spring Boot GC slide covers only choosing a collector. |
| Interview prep | **New study plan and round-to-tab matrix** | The current plan predates five tabs. |

### P2-B: backlog, in rough priority order
- **Reference deck:** consumer-driven contract tests (Pact / Spring Cloud Contract); supply-chain security (SBOM, signing, SLSA); threat modelling and the OWASP API Top 10; AsyncAPI for event contracts; a platform-engineering / internal-developer-portal slide; add *Designing Data-Intensive Applications* and *Team Topologies* to the reading list.
- **Spring Boot:** Redis caching configuration; a "when WebFlux/R2DBC" slide; GraphQL, WebSocket and SSE in one "other web stacks" slide; `spring.mvc.problemdetails.enabled`; `@ConditionalOnThreading`.
- **Event-driven:** Apache Flink compared with Kafka Streams; Spring Cloud Stream; Kafka Connect error handling and DLQs.
- **Spring AI:** AI governance and the EU AI Act; A2A and multi-agent protocols; evaluating agents.
- **System design:** distributed job scheduler; collaborative editor (OT/CRDT); metrics/logging platform; real-time ad-click aggregation; ticket/seat booking; LLM serving and RAG at scale.
- **LLD:** vending machine, tic-tac-toe / snake-and-ladder, hotel booking, logging framework, in-memory file system, meeting-room scheduler, or at least a "prompt → which problem it is" table with skeletons.
- **Core Java:** JPMS (the tab's reflection demos are where `--add-opens` comes up); a JDK 26 slide covering JEP 500 (prepare to make `final` mean final, which affects frameworks), JEP 517 (HTTP/3 in `HttpClient`) and JEP 516 (AOT object caching with any GC). Check each JEP's status before writing.
- **DSA:** matrix traversal, K-way merge (373/378), segment tree / Fenwick (307/315), KMP / Rabin-Karp / Z (28/214/1392), interval DP (312), bitmask DP (847/698), tree DP (337/968), bipartite (785), bridges (1192), Eulerian path (332), the classic tree problems (236, 297, 105), and design-a-structure problems (146, 155, 380, 460). Also **mark LeetCode Premium problems** (252, 253, 370, 774, 1135, 1168, 1102) and give a free alternative for each.

---

## 7. Phase 5: guards so these errors do not come back (P3)

> **Dropped: D4 was declined.** No build guards. Kept for reference only.

1. **Ban prose slide numbers.** In `build.mjs`, fail the build when slide text matches `/\bslides? \d+\b/` outside a `data-slide` link. This would have caught #27 and the three Streams references.
2. **A version manifest.** Add `src/versions.json` (Boot, Framework, Java, Hibernate, Security, Kafka, Spring AI, Testcontainers and JUnit, per tab). Have the build warn when slide text names an off-baseline major version ("Spring Security 6", "Hibernate 6", "JUnit 5") or a renamed property (`management.otlp.tracing`, `spring.cloud.gateway.routes`) outside a box marked as legacy.
3. **Compile the code in the old tabs.** The Spring AI, LLD, Core Java and Streams tabs already compile and run their listings, which is why they have almost no errors. Extend that harness to the complete files in the Spring Boot, Reference deck and Event-driven tabs. Label the rest "excerpt, not compiled". Items #8, #26, #31 and the section 8 code slips are the kind it catches.
4. **A register of facts that expire.** List EOL dates, framework defaults (Kafka, Boot, Hikari), property names, JEP statuses and model behaviour with a "re-check by" date, and review it each quarter. Most of the outdated items above are exactly this kind of fact.

---

## 8. Smaller fixes (P3)

> **Done, 12 October 2026: all 18 open items below are fixed.** Notes on three of them:
> - The `simpleDateFormat` example existed only in `01-architecture/05`; it is now a `serializerByType` customizer, which a property cannot replace. `07-internals/06` needed no change.
> - The Ollama test image is pinned to `0.40.3`, the release current on 12 October 2026.
> - The "garbled" LLD sentence was "made virtual threads final" followed by a "since 21" version badge. It is reworded to read naturally with the badge.

- **Spring Boot**
  - `07-internals/09`: `DateRangeValidator` reads `placedAt()` and `deliverBy()`, which `OrderPayload` (`id`, `lines`, `currency`) does not have.
  - `07-internals/10`: the enum-parameter "leak" happens only if your own handler echoes `ex.getMessage()`, since Boot omits error messages by default (`server.error.include-message=never`). Say so.
  - `08-production/04`: `MDC.clear()` also wipes the tracing `traceId`/`spanId` for whatever still logs inside the trace scope. Remove only your own keys (`MDC.remove`, or `MDC.putCloseable`).
  - ~~`04-validation`: "a errors property" should read "an errors property".~~ Fixed with #11.
  - `07-internals/12` (moved from section 5): `@ConditionalOnExpression("… '${spring.profiles.active}' …")` has no default, so startup fails when no profile is set. Use `${spring.profiles.active:}`, or better, `@Profile("!test")`.
  - `01-architecture/05` and `07-internals/06` (moved from section 5): the `simpleDateFormat("yyyy-MM-dd")` customizer only affects `java.util.Date`, not the `java.time` types the atlas uses. Show a setting that changes something real, such as `serializationInclusion(NON_NULL)`.
- **Reference deck**
  - `03-backend/02`: `this.paymentRef = ref` assigns an undeclared field.
  - `03-backend/04`: `.map(mapper.toDomain())` should be `.map(mapper::toDomain)`.
  - `03-backend/06`: "readOnly … lets the driver route to a replica". The PostgreSQL driver does not. You need a routing `DataSource`, for example `LazyConnectionDataSourceProxy` with a read-only target (Framework 6.1+).
  - `07-cross-cutting/01`: "fails OPEN-looking" describes fail-closed behaviour; reword.
  - `07-cross-cutting/04`: "Three dashboards panels".
  - `07-cross-cutting/05`: the shared context already gives "one container per build across test classes". `.withReuse(true)` keeps the container across JVM runs, and only with `testcontainers.reuse.enable=true` in `~/.testcontainers.properties`.
  - `05-data/01`: `GRANT … ON ALL TABLES` misses tables created later (`ALTER DEFAULT PRIVILEGES`). A pool per module role also multiplies the connection count against the `max_connections` arithmetic in `07-cross-cutting/07`.
- **Event-driven**
  - `05-at-scale/12`: the upcaster uses `asDouble()` for money; use `decimalValue()`.
  - `05-at-scale/02`: the velocity alert (`count >= 5` on a windowed count) fires again on every later update. Use `suppress(untilWindowCloses)` or `count == 5`.
- **Spring AI**
  - `14-common-use-cases/02`: "first words in about a second, even when tools run". Text that depends on a tool result cannot stream until that tool round-trip finishes.
  - `16-production/07`: `ollama/ollama:latest` goes against the tab's own "pin the version" advice (`02-llm-fundamentals/05`).
- **LLD** `15-concurrency/03`: "Java 21 made virtual threads final since 21" is garbled.
- **Core Java** `01-orientation/03`: the index entry "ZoÃ« from the wrong charset" is deliberate mojibake but reads like an encoding bug. Put it in quotes or code formatting.

---

## 9. What to keep exactly as it is

- The **"failure behind each feature"** format, the dated, numeric ADR example, and the decision-hierarchy framing. This is what makes the atlas better than vendor docs.
- The tabs whose **code is run and whose output is shown** (Spring AI, LLD, Core Java, Streams). They had almost no errors, which is the argument for guard 3 above.
- The System design tab's **arithmetic**: about 40 estimates were re-derived, and all but one held.
- The cross-reference build (`data-deck`/`data-slide`), which should be used everywhere (section 7, guard 1).

---

## 10. Suggested order of work

| Wave | Scope | Status |
|---|---|---|
| 1 | Section 3 (#1–#40) and section 4 | **Done**, 12 October 2026 (not yet committed) |
| 2 | Section 5 (re-baseline) | Dropped: D1 declined |
| 3 | Section 6 (new content) | Dropped: D3 declined |
| 4 | Section 7 (build guards) | Dropped: D4 declined |
| 5 | Section 8 (smaller fixes, 18 items) | **Done**, 12 October 2026 |

`index.html` is committed and served as-is, so run `node build.mjs` after each wave. Run `node build.mjs --check` in CI.

---

## 11. What the verification pass changed

Every item was re-checked against the slide source; version and behaviour claims were re-checked against documentation or framework source.

**Withdrawn (my first pass was wrong)**
- *`@Retryable` and `@Transactional` on one method retry inside the transaction* (old deck item). Both Spring Retry and Framework 7 order the retry advice outside the transaction, so the deck slide is right. The Spring Boot slide that forbids it is now the item (#16).
- *`Specification.where` was removed in Spring Data JPA 4.0.* It [still exists in 4.1](https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/domain/Specification.html); only a `null` argument is rejected. The slide's specifications return a non-null lambda whose predicate may be `null`, which 4.x still accepts. No change needed.
- *"Ten phases" but seven are drawn* (Spring Boot `02-lifecycle/01`). Phases 1–4, 5a–5d, 6 and 7 make ten.
- *`allow.everyone.if.no.acl.found=false` is already the default* (Event-driven `06-operations/01`). Setting it explicitly is not wrong.
- *Verify that Anthropic's current models reject `temperature`* (Spring AI `02-llm-fundamentals/03`). [Anthropic's migration guides](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide) confirm a 400 error for non-default sampling parameters on Claude 4.7 and later and on Sonnet 5/5.5. The slide is correct.

**Corrected**
- News-feed cache (#39): my earlier "6–12 TB" was an arithmetic slip; it is about 12–15 TB as a skiplist, or about 3 TB with listpack encoding.
- `@Async` (#1): the precise Boot defaults, including the virtual-thread case.
- Kafka ack (#24, #32): the loss window is a crash or rebalance between the two commits, because the error handler's seek still redelivers within the session. `AckMode.MANUAL` is now listed as an alternative fix.
- Outbox (#31): the fix now also preserves per-key order.
- Saga (#33): `@Version` already prevents a double state change; the risk is a double compensating command.
- Jackson (#10): the failure needs no zone anywhere, so `spring.jackson.time-zone` also prevents it.
- Validation (#11): now named, with the exception that replaces `MethodArgumentNotValidException`.
- Gateway (#22): the prefix change is dated to Spring Cloud 2025.0.
- Testcontainers: "the 1.x API is wrong" softened to "move to the 2.x package and artifacts".

**Added or promoted after verification**
- `allocationSize` mismatch (#17): Hibernate's default really is `EXCEPTION`.
- OTLP property rename (#23).
- The open-in-view problem in tenant scoping (#9b).
- The direct-buffer default cap (#13b).
- `@Scheduled`/`@EventListener` are not proxy-based (#3).
- The idempotency IN_PROGRESS case with the IETF status code (#21).
- The Modulith "exactly this" wording, reframed as a contradiction inside the Reference deck.

---

## 12. Implementation log (Phases 1 and 2, 12 October 2026)

`node build.mjs` and `node build.mjs --check` pass, so every new cross-reference resolves. The changed figures (JVM memory, news feed) and the new DSA slides were checked in a browser with no console errors. There is no JDK on this machine, so the new Java was checked by hand. The 18 DSA solutions were also ported line for line to JavaScript and pass 49 LeetCode example cases.

**Where the implementation goes beyond or differs from the text above**
- **#24, #32 (Kafka ack order):** the four Event-driven listeners and the deck consumer now drop `@Transactional` and wrap the work in a `TransactionTemplate` (or the service's own transaction), then ack. This follows the tab's own rule rather than switching to `AckMode.MANUAL`.
- **#33 (saga):** the command is written to the outbox; the sweeper locks rows with `SKIP LOCKED`.
- **#37 (compliance):** clauses now carry a `category`, and every rule of that category is retrieved instead of the top 3 by similarity.
- **#39 (news feed):** the cap is now **800** everywhere, matching the data-model slide. The figure reads 1.9 TB of raw ids and about 20 TB as Redis sorted sets, with a caption on the listpack option (about 5 TB).
- **#9 (tenancy):** both slides now lead with Hibernate `@TenantId`. The `@Filter` traps and the RLS caveats are kept, and the deck slide links to the Spring Boot one.
- **Section 4, DSA:** the three missing "six in streams" slides are written for patterns 28–30. The orientation now says five slides per pattern on all three orientation slides, not only the first.
- **Section 4, numbered references:** one more prose slide number was found and converted: the C4 slide's "slide 2 of this deck" (`deck/08-scale-and-governance/05`).
- **Section 4, study plan:** `017-plan.html` now covers all ten tabs (including the SQL & NoSQL tab merged from main) and points to the rounds table, which now also links the System design tab.
- **Section 4, graceful shutdown:** the Spring Boot examples now set `spring.lifecycle.timeout-per-shutdown-phase` instead of the default `server.shutdown: graceful`.

**Not done**
- Sections 5, 6 and 7: dropped, because D1, D3 and D4 were declined.
- The new and changed Java has not been compiled, because there is no JDK on the machine used. Compile the Spring Boot, Reference deck, Event-driven, Spring AI and DSA listings that changed before relying on them.

---

### Sources consulted for the version-sensitive findings
- **Boot support dates and releases**
  - [Spring Boot 3.5.16, the final 3.5.x OSS release](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/)
  - [endoflife: Spring Boot](https://eosl.date/eol/product/spring-boot/)
  - [Spring Boot 4.1.0 available now](https://spring.io/blog/2026/06/10/spring-boot-4/)
- **Boot 4 migration**
  - [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) (Undertow, starters, test starters, Batch, Spring Retry, Jackson 3)
  - [Spring Boot 4.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes)
  - [OpenRewrite: Boot 4.0 property renames](https://docs.openrewrite.org/recipes/java/spring/boot4/springbootproperties_4_0)
  - [OpenTelemetry with Spring Boot (Spring blog)](https://spring.io/blog/2025/11/18/opentelemetry-with-spring-boot/)
  - [Spring Boot 4.0 testing reference (JUnit 6)](https://docs.spring.io/spring-boot/4.0/reference/testing/index.html)
- **Spring Boot and Framework internals**
  - [Spring Boot: task execution and scheduling](https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html)
  - [`RetryAnnotationBeanPostProcessor` source (Framework 7)](https://raw.githubusercontent.com/spring-projects/spring-framework/main/spring-context/src/main/java/org/springframework/resilience/annotation/RetryAnnotationBeanPostProcessor.java)
  - [`EnableResilientMethods` Javadoc](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/resilience/annotation/EnableResilientMethods.html)
  - [`@EnableRetry` source (Spring Retry)](https://raw.githubusercontent.com/spring-projects/spring-retry/main/src/main/java/org/springframework/retry/annotation/EnableRetry.java)
  - [Core Spring resilience features](https://spring.io/blog/2025/09/09/core-spring-resilience-features/)
  - [`SharedEntityManagerCreator` source](https://raw.githubusercontent.com/spring-projects/spring-framework/main/spring-orm/src/main/java/org/springframework/orm/jpa/SharedEntityManagerCreator.java)
  - [Spring MVC validation (built-in method validation)](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)
- **Hibernate**
  - [Hibernate 7.1 user guide (lazy `@OneToOne`)](https://docs.hibernate.org/orm/7.1/userguide/html_single/)
  - [`FilterDef.applyToLoadByKey`](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/annotations/FilterDef.html)
  - [`MappingSettings` (sequence mismatch default)](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/cfg/MappingSettings.html)
  - [`SequenceMismatchStrategy`](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/id/SequenceMismatchStrategy.html)
- **Spring Data**
  - [Spring Data JPA `Specification` (4.1)](https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/domain/Specification.html)
  - [Spring Data AOT repositories](https://docs.spring.io/spring-data/commons/reference/4.2/aot.html)
- **Batch, Modulith, Cloud and Testcontainers**
  - [What's new in Spring Batch 6](https://docs.spring.io/spring-batch/reference/whatsnew.html)
  - [Spring Modulith 2.1 appendix (event properties)](https://docs.spring.io/spring-modulith/reference/appendix.html)
  - [Spring Cloud 2025.0.0 release notes](https://spring.io/blog/2025/05/29/spring-cloud-2025-0-0-is-abvailable)
  - [Spring Cloud 2025.1.0 release notes](https://spring.io/blog/2025/11/25/spring-cloud-2025-1-0-aka-oakwood-has-been-released/)
  - [OpenRewrite: Spring Cloud Gateway properties](https://docs.openrewrite.org/recipes/java/spring/cloud2025/springcloudgatewayproperties)
  - [Testcontainers 2.0.0 release](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.0)
- **Other**
  - [Angular 20 `RxResourceOptions`](https://v20.angular.dev/api/core/rxjs-interop/RxResourceOptions)
  - [IETF Idempotency-Key header draft 07](https://www.ietf.org/archive/id/draft-ietf-httpapi-idempotency-key-header-07.html)
  - [Anthropic: Claude Opus 5.5 migration guide (sampling parameters)](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide)
  - [Baeldung: formatting an Instant needs a zone](https://www.baeldung.com/java-instant-to-string)
