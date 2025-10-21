"use client";

interface Unit {
  unitNumber: string;
  complexName: string;
  rent: number;
  leaseStart?: Date;
  leaseEnd?: Date;
}

export default function UnitInfo({ unit }: { unit: Unit | null }) {
  if (!unit) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-800">No unit assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-600">Unit Number</p>
        <p className="text-lg font-semibold">{unit.unitNumber}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Complex</p>
        <p className="text-lg font-semibold">{unit.complexName}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Monthly Rent</p>
        <p className="text-lg font-semibold">${unit.rent}</p>
      </div>
      {unit.leaseStart && unit.leaseEnd && (
        <div>
          <p className="text-sm text-gray-600">Lease Period</p>
          <p className="text-lg font-semibold">
            {unit.leaseStart.toLocaleDateString()} - {unit.leaseEnd.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
