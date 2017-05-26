import Vertex from "../src/vertex";
import { expect } from "chai";

describe("Vertex", function() {
    const testVertexInitialData = {
        _type: "Test",
        _id: "test@vertex",
        foo: "bar",
        baz: 1
    };

    const testRelationIds = ["a", "b", "c"];
    const testRelationObjects = testRelationIds.map(id => ({
        _id: id,
        _type: "test"
    }));

    const testVtx = new Vertex(testVertexInitialData);

    it("should know it's id", () => {
        expect(testVtx._id).to.be.equal("test@vertex");
    });

    it("should know it's type", () => {
        expect(testVtx.type()).to.be.equal("Test");
    });

    it("should be able to fetch props", () => {
        expect(testVtx.get("foo")).to.be.equal("bar");
    });

    it("should be able to update props", () => {
        testVtx.set("foo", "baz");
        expect(testVtx.get("foo")).to.be.equal("baz");
    });

    it("should not be care about mutations to the original data", () => {
        expect(testVertexInitialData.foo).to.be.equal("bar");
        testVertexInitialData.baz = "not one any more";
        expect(testVtx.get("baz")).to.be.equal(1);
    });

    it("should retain initial values", () => {
        expect(testVtx._before.foo).to.be.equal("bar");
        testVtx.set({ foo: "boom" });
        expect(testVtx._before.foo).to.be.equal("bar");
    });

    it("should be able to add and read relation data", () => {
        testVtx.setVertices("rel", testRelationObjects);
        expect(testVtx.getIds("rel")).to.have.members(testRelationIds);
        expect(testVtx.getCount("rel")).to.equal(testRelationIds.length);
    });

    it("should be able to serialize itself", () => {
        const serial = testVtx.plain();
        Object.keys(serial).forEach(key => {
            if (key === "_") {
                const keys = ["relIds", "relCount"];
                expect(Object.keys(serial._)).to.have.members(keys);
                expect(serial._.relIds).to.deep.equal(testVtx.getIds("rel"));
                expect(serial._.relCount).to.deep.equal(
                    testVtx.getCount("rel")
                );
            } else {
                expect(testVtx.get(key)).to.deep.equal(serial[key]);
            }
        });
    });
});
