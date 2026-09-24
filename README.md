# Spring Boot Architecture Atlas

A working reference for building enterprise Java + Spring Boot systems, packaged as one self-contained HTML page. It covers layering, module boundaries, middleware, data, frontend, event-driven design and production operations. Every example uses the same running system: an order platform for a mid-size retailer.

The page also has an interview-prep guide and a data-structures-and-algorithms (DSA) patterns deck with Java solutions.

## Viewing it

There is no build step. Open `index.html` in a browser:

```bash
git clone https://github.com/VimalKmr250/spring-boot-architecture-atlas-claude.git
cd spring-boot-architecture-atlas-claude
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

The page loads fonts from Google Fonts and syntax highlighting from highlight.js (cdnjs). Offline, it falls back to system fonts and plain code blocks.

## What's inside

The page has five tabs.

| Tab | Slides | Focus |
| --- | ---: | --- |
| **Reference deck** | 68 | Enterprise architecture on Spring Boot 4.1 / Framework 7 |
| **Spring Boot** | 56 | Boot from the container up, on 3.4/3.5 with Boot 4 deltas |
| **Event-driven** | 60 | Event-driven systems on Kafka 4, from first principles to production |
| **Interview prep** | — | The same material rearranged as questions, scripts and numbers |
| **DSA patterns** | 124 | 30 algorithm patterns, 180 linked LeetCode problems, Java 17+ |

### Reference deck

Nine sections:

- **Foundations**: system context (C4 L1), the decision hierarchy, a comparison of four architecture styles, Conway's law
- **Modular monolith**: module anatomy, api/spi boundaries, ArchUnit, Spring Modulith, reliable events, extracting a service, the strangler fig
- **Backend**: layering, aggregates, use cases and transactions, ports and adapters, persistence traps, concurrency and idempotency, error shape, API versioning
- **Middleware**: gateway vs BFF vs service mesh, resilience, event topology, outbox and CDC, sagas, caching
- **Data**: data ownership, zero-downtime schema changes, read models, event sourcing, search and reporting
- **Frontend**: Angular structure, shared API contracts, authentication, micro-frontends, delivery and performance
- **Cross-cutting**: security, config and secrets, observability, SLOs, testing strategy, build and deployment
- **Scale & governance**: multi-region, disaster recovery, capacity and cost, privacy, C4, fitness functions
- **Wrap-up**: anti-patterns, decision records, the whole picture, your first 90 days

### Spring Boot

- **Architecture**: the layer cake, auto-configuration, the `@Conditional` family
- **Lifecycle**: startup, bean, HTTP request, transaction and persistence context
- **Starters**: core, messaging, batch, cloud
- **Core annotations**, **JPA** and **Security** catalogues, each showing what breaks when an annotation is misused
- **Internals**: AOP, transaction propagation and isolation, Jackson, Spring Data, SpEL
- **Production**: Actuator, metrics, logging, JVM memory, GC, profiling, leaks, load tests
- **Reference**: the Spring Boot 3 → 4 changes in one table

### Event-driven

- **Foundations**: events vs commands, event shapes, choreography vs orchestration
- **Guarantees**: delivery semantics, idempotency, ordering, the dual-write problem, CDC
- **Kafka internals**: the log, replication and ISR, consumer groups, rebalancing, compaction, transactions
- **Spring**: spring-kafka listeners, error handling, retry topics, transactions, testing, Streams
- **At scale**: sagas, CQRS projections, multi-region, schema strategy, governance
- **Operations**: SLIs, lag, replay, failure scenarios, migration playbook, broker comparison

### Interview prep

A scrolling page. It covers what the architecture round tests, a six-step approach to any design question, and questions in five areas:

- Architecture and modularity
- Data and consistency
- Integration, messaging and resilience
- Spring and Java specifics
- API design and frontend

It ends with two whiteboard scripts, numbers worth memorising, five stories to have ready, and common red flags.

### DSA patterns

Thirty self-contained patterns, from sliding window and two pointers through graphs, tries, bit manipulation and dynamic programming. Each pattern has four slides:

1. **Mechanics**: the invariant and why the work is bounded
2. **Dry run**: one input traced step by step
3. **Structure**: a reusable Java skeleton and the parts you change per problem
4. **Problems**: six LeetCode problems, two solved in full and four shown as changes to the skeleton

## Navigation

| Key | Action |
| --- | --- |
| `←` / `→`, `PageUp` / `PageDown` | Previous / next slide |
| `Home` / `End` | First / last slide |
| `C` | Toggle the contents panel |
| `Esc` | Close the contents panel |

Every slide has its own URL, so you can bookmark or share it:

- `index.html#deck/12`
- `index.html#springboot/5`
- `index.html#events/30`
- `index.html#dsa/1`
- `index.html#interview`

## Conventions

- **Copper** highlights the path or hop under discussion. **Teal** always means an asynchronous channel.
- Versions differ by tab on purpose:
  - The reference deck targets **Spring Boot 4.1**.
  - The Spring Boot tab targets **3.4/3.5**, which most enterprise codebases run today. Boxes marked "Boot 4" show what changed.
  - The Event-driven tab uses **Boot 3.5** code with Boot 4 notes.
- Build snippets use Gradle unless a slide says Maven.
- The page supports light and dark themes and follows your system setting.

## Project layout

```
.
├── index.html   # the whole atlas: markup, styles, and navigation script
└── README.md
```

## Contributing

1. Branch off `main`.
2. Edit `index.html`. Each slide is a `<section class="slide">` whose `data-sec` and `data-title` attributes fill the contents panel.
3. Open the page in a browser. Check the slide in light and dark mode and at phone width.
4. Open a pull request.
