import React, {useState} from 'react';

export default function Checkout({onSubmit, initial=0}){
  const [amount, setAmount] = useState(initial);

  return (
    <div className="card" style={{marginTop:12}}>
      <div className="form-row">
        <label>Amount</label>
        <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
      </div>
      <div>
        <button onClick={() => onSubmit && onSubmit(Number(amount))}>Submit</button>
      </div>
    </div>
  )
}
