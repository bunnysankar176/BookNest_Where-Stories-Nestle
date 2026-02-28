import { useEffect, useState } from "react";
import { Card, Row, Col } from "react-bootstrap";
import * as cartService from "../../services/cartService";

function UserStats() {
  const [stats, setStats] = useState({
    orders: 0,
    spent: 0,
    cartItems: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await cartService.getUserStats();
        setStats(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <h3>User Dashboard</h3>
      <Row className="mt-4">
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <h5>Total Orders</h5>
              <h2>{stats.orders}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <h5>Total Spent</h5>
              <h2>₹{stats.spent}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <h5>Cart Items</h5>
              <h2>{stats.cartItems}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default UserStats;
