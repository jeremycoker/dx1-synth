import XCTest
@testable import DX1Core

final class CommandQueueTests: XCTestCase {
    func testFifoOrderAndPayloads() {
        let q = CommandQueue(capacity: 8)
        q.push(EngineCommand(.noteOn, a: 60, b: 0.8))
        q.push(EngineCommand(.noteOff, a: 60))
        q.push(EngineCommand(.masterVolume, b: 0.5))
        let c1 = q.pop()!
        XCTAssertEqual(c1.kind, .noteOn)
        XCTAssertEqual(c1.a, 60)
        XCTAssertEqual(c1.b, 0.8, accuracy: 1e-6)
        XCTAssertEqual(q.pop()!.kind, .noteOff)
        XCTAssertEqual(q.pop()!.b, 0.5)
        XCTAssertNil(q.pop())
    }

    func testOverflowDropsAndRecovers() {
        let q = CommandQueue(capacity: 4)
        for i in 0..<4 { XCTAssertTrue(q.push(EngineCommand(.noteOn, a: Int32(i)))) }
        XCTAssertFalse(q.push(EngineCommand(.noteOn, a: 99)), "full ring must reject")
        XCTAssertEqual(q.pop()!.a, 0)
        XCTAssertTrue(q.push(EngineCommand(.noteOn, a: 4)), "space after pop")
        // drains in order, dropped command never appears
        let rest = (0..<4).map { _ in q.pop()!.a }
        XCTAssertEqual(rest, [1, 2, 3, 4])
        XCTAssertNil(q.pop())
    }

    func testConcurrentProducerConsumer() {
        let q = CommandQueue(capacity: 1024)
        let n = 100_000
        var received: [Int32] = []
        received.reserveCapacity(n)
        let producer = Thread {
            var i: Int32 = 0
            while i < Int32(n) {
                if q.push(EngineCommand(.noteOn, a: i)) { i += 1 }
            }
        }
        producer.start()
        while received.count < n {
            if let c = q.pop() { received.append(c.a) }
        }
        // strict FIFO with no loss or duplication
        for (i, v) in received.enumerated() where Int32(i) != v {
            XCTFail("out of order at \(i): \(v)")
            break
        }
        XCTAssertEqual(received.count, n)
    }
}
